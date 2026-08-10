import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { foldersApi, pagesApi, settingsApi, tagsApi, trashApi, versionsApi } from "./api";
import ConfirmDialog from "./components/ConfirmDialog";
import EmptyState from "./components/EmptyState";
import HomePage from "./components/HomePage";
import LibraryPage from "./components/LibraryPage";
import PageContextMenu from "./components/PageContextMenu";
import SearchPage from "./components/SearchPage";
import SettingsPage from "./components/SettingsPage";
import Sidebar from "./components/Sidebar";
import TagsPage from "./components/TagsPage";
import TemplateGallery from "./components/TemplateGallery";
import TrashPage from "./components/TrashPage";
import MobileBottomNav from "./components/MobileBottomNav";
import { templatePlainText } from "./templates";
import { normalizeTags, pageTitle, tagTone } from "./utils";

const Editor = lazy(() => import("./components/Editor"));

const defaultSettings = {
  fontFamily: "system",
  fontSize: 16,
  editorWidth: "standard",
  theme: "system",
  lineSpacing: "comfortable",
  reduceMotion: false,
  customFonts: [],
  tagColors: {},
};

const pendingDraftKey = "notenest:pending-draft:v1";

function readPendingDraft() {
  try {
    const pending = JSON.parse(window.localStorage.getItem(pendingDraftKey));
    return pending?.page?.id ? pending : null;
  } catch {
    return null;
  }
}

function rememberPendingDraft(page, baseSignature) {
  try {
    window.localStorage.setItem(pendingDraftKey, JSON.stringify({
      page,
      baseSignature,
      cachedAt: new Date().toISOString(),
    }));
  } catch {
    // A failed browser cache must not interrupt editing or the primary save path.
  }
}

function clearPendingDraft(pageId) {
  try {
    const pending = readPendingDraft();
    if (!pending || !pageId || pending.page.id === pageId) {
      window.localStorage.removeItem(pendingDraftKey);
    }
  } catch {
    // Storage can be unavailable in hardened browser contexts.
  }
}

function pageSignature(page) {
  return JSON.stringify({
    title: page.title,
    content: page.content,
    blocks: page.blocks,
    icon: page.icon,
    coverUrl: page.coverUrl,
    folderId: page.folderId,
    folder: page.folder,
    tags: page.tags,
    favorite: page.favorite,
  });
}

function pageChanges(page) {
  return {
    title: page.title,
    content: page.content,
    blocks: page.blocks,
    icon: page.icon,
    coverUrl: page.coverUrl,
    folderId: page.folderId,
    folder: page.folder,
    tags: page.tags,
    favorite: page.favorite,
  };
}

function sortByUpdatedAt(pages) {
  return [...pages].sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));
}

export default function App() {
  const [pages, setPages] = useState([]);
  const [draft, setDraft] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState("saved");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState("home");
  const [selectedTag, setSelectedTag] = useState("");
  const [settings, setSettings] = useState(defaultSettings);
  const [folderEntities, setFolderEntities] = useState([]);
  const [tagEntities, setTagEntities] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState("");
  const [trashPages, setTrashPages] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [folderDeleteCandidate, setFolderDeleteCandidate] = useState(null);
  const [pageMenu, setPageMenu] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState(false);
  const [connected, setConnected] = useState(true);
  const [recoveredDraft, setRecoveredDraft] = useState(false);
  const [retrySequence, setRetrySequence] = useState(0);
  const lastSavedRef = useRef("");
  const draftRef = useRef(null);
  const saveSequenceRef = useRef(0);
  const saveTimerRef = useRef(null);
  const saveQueueRef = useRef(Promise.resolve());

  draftRef.current = draft;

  const closePageMenu = useCallback(() => setPageMenu(null), []);
  const handleOpenPageMenu = useCallback((event, page) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const fromPointer = event.type === "contextmenu" && (event.clientX !== 0 || event.clientY !== 0);
    setPageMenu({
      page,
      pageId: page.id,
      x: fromPointer ? event.clientX : rect.right + 5,
      y: fromPointer ? event.clientY : rect.bottom + 4,
    });
  }, []);

  function queuePageSave(page) {
    const operation = saveQueueRef.current
      .catch(() => null)
      .then(() => pagesApi.update(page.id, pageChanges(page)));
    saveQueueRef.current = operation;
    return operation;
  }

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pagesApi.list();
      setPages(data);
      setError("");
      setConnected(true);
      if (data.length > 0) {
        const pending = readPendingDraft();
        const current = draftRef.current;
        const linkedPageId = new URLSearchParams(window.location.search).get("page");
        const cachedPage = pending ? data.find((page) => page.id === pending.page.id) : null;
        const serverPage = cachedPage ?? data.find((page) => page.id === linkedPageId) ?? data.find((page) => page.id === current?.id) ?? data[0];
        const canRecover = cachedPage && pageSignature(pending.page) !== pageSignature(cachedPage);
        const selected = canRecover ? { ...cachedPage, ...pageChanges(pending.page) } : serverPage;
        lastSavedRef.current = pageSignature(serverPage);
        setDraft(selected);
        setRecoveredDraft(Boolean(canRecover));
        if (linkedPageId && serverPage.id === linkedPageId) setView("editor");
        if (!canRecover) clearPendingDraft(pending?.page?.id);
      } else {
        setDraft(null);
        lastSavedRef.current = "";
        setRecoveredDraft(false);
        clearPendingDraft();
      }
    } catch (requestError) {
      setError(requestError.message);
      setConnected(false);
      const pending = readPendingDraft();
      if (pending?.page) {
        setPages([pending.page]);
        setDraft(pending.page);
        lastSavedRef.current = pending.baseSignature ?? "";
        setRecoveredDraft(true);
        setSaveState("offline");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const loaded = await settingsApi.get();
      setSettings({
        ...defaultSettings,
        ...loaded,
        customFonts: loaded.customFonts ?? [],
        tagColors: loaded.tagColors ?? {},
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  const loadTaxonomy = useCallback(async () => {
    try {
      const [folders, tags] = await Promise.all([foldersApi.list(), tagsApi.list()]);
      setFolderEntities(folders);
      setTagEntities(tags);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  function reloadWorkspace() {
    loadPages();
    loadSettings();
    loadTaxonomy();
  }

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  useEffect(() => {
    const retryWhenOnline = () => setRetrySequence((current) => current + 1);
    window.addEventListener("online", retryWhenOnline);
    return () => window.removeEventListener("online", retryWhenOnline);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadTaxonomy();
  }, [loadTaxonomy]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--editor-font-size", `${settings.fontSize}px`);
    const builtInFonts = {
      system: "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      serif: "Georgia, 'Times New Roman', serif",
      mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
    };
    if (builtInFonts[settings.fontFamily]) {
      root.style.setProperty("--editor-font", builtInFonts[settings.fontFamily]);
      return undefined;
    }

    const customFont = settings.customFonts.find((font) => font.url === settings.fontFamily);
    if (!customFont) {
      root.style.setProperty("--editor-font", builtInFonts.system);
      return undefined;
    }

    let cancelled = false;
    const family = `NoteNestCustom-${settings.customFonts.indexOf(customFont)}`;
    const fontFace = new FontFace(family, `url("${customFont.url}")`);
    fontFace.load().then((loaded) => {
      if (cancelled) return;
      document.fonts.add(loaded);
      root.style.setProperty("--editor-font", `"${family}", sans-serif`);
    }).catch(() => root.style.setProperty("--editor-font", builtInFonts.system));
    return () => {
      cancelled = true;
    };
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const applyAppearance = () => {
      root.dataset.theme = settings.theme === "system" ? (systemTheme.matches ? "dark" : "light") : settings.theme;
      root.dataset.reduceMotion = settings.reduceMotion ? "true" : "false";
      const lineHeights = { compact: 1.55, comfortable: 1.75, relaxed: 2 };
      root.style.setProperty("--editor-line-height", lineHeights[settings.lineSpacing] ?? lineHeights.comfortable);
    };
    applyAppearance();
    systemTheme.addEventListener("change", applyAppearance);
    return () => systemTheme.removeEventListener("change", applyAppearance);
  }, [settings.lineSpacing, settings.reduceMotion, settings.theme]);

  useEffect(() => {
    if (!draft) return undefined;
    const signature = pageSignature(draft);
    if (signature === lastSavedRef.current) return undefined;

    rememberPendingDraft(draft, lastSavedRef.current);
    const sequence = ++saveSequenceRef.current;
    setSaveState("saving");
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const saved = await queuePageSave(draft);
        if (sequence !== saveSequenceRef.current) return;
        lastSavedRef.current = pageSignature(saved);
        clearPendingDraft(saved.id);
        setDraft(saved);
        setPages((current) => sortByUpdatedAt(
          current.some((page) => page.id === saved.id)
            ? current.map((page) => (page.id === saved.id ? saved : page))
            : [saved, ...current],
        ));
        setSaveState("saved");
        setConnected(true);
        setRecoveredDraft(false);
      } catch {
        if (sequence === saveSequenceRef.current) {
          setSaveState("offline");
          setConnected(false);
        }
      }
    }, 700);

    return () => {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    };
  }, [draft, retrySequence]);

  const selectedId = draft?.id ?? null;
  const hasPages = pages.length > 0;
  const favoritePages = useMemo(() => pages.filter((page) => page.favorite), [pages]);
  const workspaceFolders = useMemo(() => folderEntities.map((folder) => ({
    ...folder,
    pageCount: pages.filter((page) => page.folderId === folder.id).length,
  })), [folderEntities, pages]);
  const activeFolder = useMemo(() => workspaceFolders.find((folder) => folder.id === activeFolderId) ?? null, [activeFolderId, workspaceFolders]);
  const tagColors = useMemo(() => ({
    ...(settings.tagColors ?? {}),
    ...Object.fromEntries(tagEntities.map((tag) => [tag.name, tag.color])),
  }), [settings.tagColors, tagEntities]);
  const editorSettings = useMemo(() => ({ ...settings, tagColors }), [settings, tagColors]);

  async function flushDraft() {
    if (!draft || pageSignature(draft) === lastSavedRef.current) return true;
    window.clearTimeout(saveTimerRef.current);
    saveSequenceRef.current += 1;
    rememberPendingDraft(draft, lastSavedRef.current);
    setSaveState("saving");
    try {
      const saved = await queuePageSave(draft);
      lastSavedRef.current = pageSignature(saved);
      clearPendingDraft(saved.id);
      setDraft(saved);
      setPages((current) => sortByUpdatedAt(current.map((page) => (page.id === saved.id ? saved : page))));
      setSaveState("saved");
      setConnected(true);
      setRecoveredDraft(false);
      return true;
    } catch (requestError) {
      setSaveState("offline");
      setConnected(false);
      return false;
    }
  }

  function retryPendingSave() {
    setError("");
    if (connected) setRetrySequence((current) => current + 1);
    else reloadWorkspace();
  }

  function replaceSavedPages(savedPages) {
    const savedById = new Map(savedPages.map((page) => [page.id, page]));
    setPages((current) => sortByUpdatedAt(current.map((page) => savedById.get(page.id) ?? page)));
    setDraft((current) => {
      const saved = current ? savedById.get(current.id) : null;
      if (!saved) return current;
      lastSavedRef.current = pageSignature(saved);
      return saved;
    });
  }

  function resolveFolderId(folder) {
    if (folder && typeof folder === "object") return folder.id ?? "";
    const value = typeof folder === "string" ? folder.trim() : "";
    return workspaceFolders.find((item) => item.id === value || item.name === value)?.id ?? "";
  }

  function setPageLocation(pageId) {
    const url = new URL(window.location.href);
    if (pageId) url.searchParams.set("page", pageId);
    else url.searchParams.delete("page");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  async function handleCreate(folder) {
    if (!(await flushDraft())) return;
    try {
      const page = await pagesApi.create({ folderId: resolveFolderId(folder) });
      setQuery("");
      setPages((current) => [page, ...current]);
      setDraft(page);
      lastSavedRef.current = pageSignature(page);
      setSaveState("saved");
      setSidebarOpen(false);
      setView("editor");
      setPageLocation(page.id);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleCreateFolder(name) {
    try {
      const created = await foldersApi.create(name);
      setFolderEntities((current) => [...current, created].sort((left, right) => left.name.localeCompare(right.name, "ko-KR")));
      setError("");
      return created;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleRenameFolder(folder, name) {
    try {
      const updated = await foldersApi.update(folder.id, name);
      setFolderEntities((current) => current.map((item) => item.id === updated.id ? updated : item));
      setPages((current) => current.map((page) => page.folderId === updated.id ? { ...page, folder: updated.name } : page));
      setDraft((current) => current?.folderId === updated.id ? { ...current, folder: updated.name } : current);
      setError("");
      return updated;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleRequestDeleteFolder(folder) {
    setFolderDeleteCandidate(folder);
  }

  async function confirmDeleteFolder() {
    if (!folderDeleteCandidate) return;
    if (!(await flushDraft())) return;
    setDeletingFolder(true);
    try {
      await foldersApi.remove(folderDeleteCandidate.id);
      setFolderEntities((current) => current.filter((folder) => folder.id !== folderDeleteCandidate.id));
      setPages((current) => current.map((page) => page.folderId === folderDeleteCandidate.id ? { ...page, folderId: "", folder: "미분류" } : page));
      if (draft?.folderId === folderDeleteCandidate.id) {
        const nextDraft = { ...draft, folderId: "", folder: "미분류" };
        setDraft(nextDraft);
        lastSavedRef.current = pageSignature(nextDraft);
      }
      if (activeFolderId === folderDeleteCandidate.id) {
        setActiveFolderId("");
        setView("all");
      }
      setFolderDeleteCandidate(null);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingFolder(false);
    }
  }

  async function handleCreateFromTemplate(template) {
    if (!(await flushDraft())) return;
    try {
      const created = await pagesApi.create();
      const page = await pagesApi.update(created.id, {
        title: template.pageTitle,
        content: templatePlainText(template),
        blocks: template.blocks,
        folder: template.folder,
        tags: template.tags,
      });
      setPages((current) => [page, ...current]);
      setDraft(page);
      lastSavedRef.current = pageSignature(page);
      setSaveState("saved");
      setView("editor");
      setPageLocation(page.id);
      loadTaxonomy();
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleSelect(page) {
    if (page.id === draft?.id) {
      setSidebarOpen(false);
      setView("editor");
      setPageLocation(page.id);
      return;
    }
    if (!(await flushDraft())) return;
    saveSequenceRef.current += 1;
    setDraft(page);
    lastSavedRef.current = pageSignature(page);
    setSaveState("saved");
    setSidebarOpen(false);
    setView("editor");
    setPageLocation(page.id);
  }

  function handleDraftChange(changes) {
    if (!draft) return;
    setDraft((current) => ({ ...current, ...changes }));
    setPages((current) => current.map((page) => (page.id === draft.id ? { ...page, ...changes } : page)));
  }

  async function handleUpdatePage(page, changes) {
    if (page.id === draft?.id) {
      handleDraftChange(changes);
      return;
    }
    try {
      const saved = await pagesApi.update(page.id, changes);
      replaceSavedPages([saved]);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleRenamePage(page, title) {
    const current = page.id === draft?.id ? draft : pages.find((item) => item.id === page.id) ?? page;
    if (current.id === draft?.id) {
      handleDraftChange({ title });
      return;
    }
    try {
      const saved = await pagesApi.update(current.id, { title });
      replaceSavedPages([saved]);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleTogglePageFavorite(page) {
    const current = page.id === draft?.id ? draft : pages.find((item) => item.id === page.id) ?? page;
    if (current.id === draft?.id) {
      handleDraftChange({ favorite: !current.favorite });
      return;
    }
    try {
      const saved = await pagesApi.update(current.id, { favorite: !current.favorite });
      replaceSavedPages([saved]);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleDuplicatePage(page) {
    const source = page.id === draft?.id ? draft : pages.find((item) => item.id === page.id) ?? page;
    if (!(await flushDraft())) return;
    try {
      const created = await pagesApi.create({ folderId: source.folderId ?? "" });
      const duplicate = await pagesApi.update(created.id, {
        ...pageChanges(source),
        title: `${pageTitle(source)} 복사본`,
        favorite: false,
      });
      setPages((current) => sortByUpdatedAt([duplicate, ...current]));
      setDraft(duplicate);
      lastSavedRef.current = pageSignature(duplicate);
      setSaveState("saved");
      setRecoveredDraft(false);
      setQuery("");
      setView("editor");
      setSidebarOpen(false);
      setPageLocation(duplicate.id);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleRequestDeletePage(page) {
    if (!page) return;
    if (page.id === draft?.id && !(await flushDraft())) return;
    setDeleteCandidate(page);
  }

  async function handleMovePage(page, folderId) {
    const current = page.id === draft?.id ? draft : pages.find((item) => item.id === page.id) ?? page;
    if (current.id === draft?.id && !(await flushDraft())) throw new Error("현재 페이지를 저장하지 못했습니다.");
    try {
      const saved = await pagesApi.update(current.id, { folderId });
      replaceSavedPages([saved]);
      setError("");
      return saved;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleCopyPageLink(page) {
    const url = new URL(window.location.href);
    url.searchParams.set("page", page.id);
    await navigator.clipboard.writeText(url.toString());
  }

  function handleOpenPageInNewTab(page) {
    const url = new URL(window.location.href);
    url.searchParams.set("page", page.id);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  async function handleDelete() {
    await handleRequestDeletePage(draft);
  }

  async function confirmDelete() {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await pagesApi.remove(deleteCandidate.id);
      clearPendingDraft(deleteCandidate.id);
      const remaining = pages.filter((page) => page.id !== deleteCandidate.id);
      setPages(remaining);
      if (draft?.id === deleteCandidate.id) {
        const nextPage = remaining[0] ?? null;
        setDraft(nextPage);
        lastSavedRef.current = nextPage ? pageSignature(nextPage) : "";
        setSaveState("saved");
        setRecoveredDraft(false);
        if (nextPage) setPageLocation(nextPage.id);
        else {
          setPageLocation("");
          setView("home");
        }
      }
      setDeleteCandidate(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeleting(false);
    }
  }

  async function loadTrash() {
    setTrashLoading(true);
    try {
      setTrashPages(await trashApi.list());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setTrashLoading(false);
    }
  }

  async function handleRestoreTrash(id) {
    try {
      const restored = await trashApi.restore(id);
      setTrashPages((current) => current.filter((page) => page.id !== id));
      setPages((current) => sortByUpdatedAt([restored, ...current]));
      if (!draft) {
        setDraft(restored);
        lastSavedRef.current = pageSignature(restored);
      }
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleRemoveTrash(id) {
    try {
      await trashApi.remove(id);
      setTrashPages((current) => current.filter((page) => page.id !== id));
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleEmptyTrash() {
    try {
      await trashApi.empty();
      setTrashPages([]);
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleRestoreVersion(versionId) {
    if (!draft || !(await flushDraft())) return null;
    try {
      const restored = await versionsApi.restore(draft.id, versionId);
      lastSavedRef.current = pageSignature(restored);
      setDraft(restored);
      setPages((current) => sortByUpdatedAt(current.map((page) => page.id === restored.id ? restored : page)));
      setSaveState("saved");
      loadTaxonomy();
      return restored;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  function handleNavigate(nextView) {
    if (nextView === "trash") loadTrash();
    if (nextView === "tags" || nextView === "home") loadTaxonomy();
    if (nextView !== "editor") setPageLocation("");
    setView(nextView);
    if (nextView !== "search") setSidebarOpen(false);
  }

  function handleOpenFolder(folder) {
    setActiveFolderId(folder.id);
    setPageLocation("");
    setView("folder");
    setSidebarOpen(false);
  }

  function handleSearchChange(value) {
    setQuery(value);
    setView("search");
  }

  async function handleOpenSettings() {
    if (!(await flushDraft())) return;
    setView("settings");
    setSidebarOpen(false);
  }

  async function handleSaveSettings(nextSettings) {
    const saved = await settingsApi.update(nextSettings);
    setSettings({ ...defaultSettings, ...saved, tagColors: saved.tagColors ?? {} });
  }

  async function refreshPagesAndTags() {
    const [nextPages, nextTags] = await Promise.all([pagesApi.list(), tagsApi.list()]);
    setPages(nextPages);
    setTagEntities(nextTags);
    setDraft((current) => {
      if (!current) return current;
      const fresh = nextPages.find((page) => page.id === current.id);
      if (!fresh) return current;
      lastSavedRef.current = pageSignature(fresh);
      return fresh;
    });
    return { pages: nextPages, tags: nextTags };
  }

  async function getTagEntity(name) {
    const matches = (tag) => tag.name.localeCompare(name, "ko-KR", { sensitivity: "accent" }) === 0;
    const cached = tagEntities.find(matches);
    if (cached) return cached;
    const fresh = await tagsApi.list();
    setTagEntities(fresh);
    return fresh.find(matches) ?? null;
  }

  async function handleImportPages(entries) {
    if (!(await flushDraft())) return;
    try {
      const imported = [];
      for (const entry of entries) {
        const created = await pagesApi.create();
        imported.push(await pagesApi.update(created.id, {
          title: entry.title || "가져온 페이지",
          content: entry.content || "",
          blocks: entry.blocks,
          icon: entry.icon || "",
          coverUrl: entry.coverUrl || "",
          folder: entry.folder || "가져온 노트",
          tags: normalizeTags(entry.tags || ["가져오기"]),
          favorite: Boolean(entry.favorite),
        }));
      }
      if (!imported.length) return;
      setPages((current) => sortByUpdatedAt([...imported, ...current]));
      setDraft(imported[0]);
      lastSavedRef.current = pageSignature(imported[0]);
      setView("editor");
      setPageLocation(imported[0].id);
      setSaveState("saved");
      await loadTaxonomy();
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleAddTag(tag, pageId, tone) {
    if (!(await flushDraft())) return;
    const page = pages.find((item) => item.id === pageId) ?? (draft?.id === pageId ? draft : null);
    if (!page) return;
    try {
      const existingTag = await getTagEntity(tag);
      if (!existingTag) await tagsApi.create(tag, tagTone(tag, { [tag]: tone }));
      const saved = await pagesApi.update(page.id, { tags: normalizeTags([...(page.tags ?? []), tag]) });
      replaceSavedPages([saved]);
      await loadTaxonomy();
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleRenameTag(tag, nextName) {
    if (!(await flushDraft())) return;
    try {
      const entity = await getTagEntity(tag);
      if (!entity) return;
      await tagsApi.update(entity.id, { name: nextName });
      await refreshPagesAndTags();
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleDeleteTag(tag) {
    if (!window.confirm(`“${tag}” 태그를 모든 노트에서 삭제할까요?`)) return;
    if (!(await flushDraft())) return;
    try {
      const entity = await getTagEntity(tag);
      if (!entity) return;
      await tagsApi.remove(entity.id);
      await refreshPagesAndTags();
      setSelectedTag("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleSetTagColor(tag, tone) {
    try {
      const entity = await getTagEntity(tag);
      if (!entity) return;
      const updated = await tagsApi.update(entity.id, { color: tone });
      setTagEntities((current) => current.map((item) => item.id === updated.id ? updated : item));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  const showRecovery = Boolean(draft) && (!connected || recoveredDraft || saveState === "offline");
  const showMobileTabs = ["home", "all", "folder", "favorites", "tags", "search", "trash", "settings"].includes(view) || (view === "editor" && !draft);
  const contextMenuPage = pageMenu
    ? (draft?.id === pageMenu.pageId ? draft : pages.find((page) => page.id === pageMenu.pageId) ?? pageMenu.page)
    : null;

  return (
    <div className={`app-shell ${showRecovery ? "has-recovery-banner" : ""} ${showMobileTabs ? "has-mobile-tabs" : ""}`} data-view={view}>
      <Sidebar
        open={sidebarOpen}
        pages={pages}
        folders={workspaceFolders}
        selectedId={selectedId}
        query={query}
        loading={loading}
        view={view}
        onQueryChange={handleSearchChange}
        onCreate={handleCreate}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleRequestDeleteFolder}
        onSelect={handleSelect}
        onOpenPageMenu={handleOpenPageMenu}
        onNavigate={handleNavigate}
        onOpenSettings={handleOpenSettings}
        onClose={() => setSidebarOpen(false)}
        connected={connected}
      />

      {showRecovery && (
        <div className="recovery-banner" role="status">
          <AlertCircle aria-hidden="true" size={17} />
          <span>{connected ? "복구한 변경 내용을 다시 저장하고 있습니다." : "저장 서비스에 연결할 수 없어 변경 내용을 이 기기에 보관했습니다."}</span>
          <button type="button" aria-label="다시 저장" onClick={retryPendingSave}><RefreshCw aria-hidden="true" size={15} /><span>다시 저장</span></button>
        </div>
      )}

      {error && !showRecovery && (
        <div className="error-banner" role="alert">
          <AlertCircle aria-hidden="true" size={17} />
          <span>{error}</span>
          <button type="button" onClick={reloadWorkspace}><RefreshCw aria-hidden="true" size={15} /> 다시 시도</button>
        </div>
      )}

      {view === "home" ? (
        <HomePage
          pages={pages}
          folders={workspaceFolders}
          tags={tagEntities}
          onCreate={handleCreate}
          onSelect={handleSelect}
          onNavigate={handleNavigate}
          onOpenFolder={handleOpenFolder}
          onOpenPageMenu={handleOpenPageMenu}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      ) : view === "settings" ? (
        <SettingsPage settings={settings} pages={pages} currentPage={draft} onSave={handleSaveSettings} onImport={handleImportPages} onBack={() => setView("editor")} onOpenSidebar={() => setSidebarOpen(true)} />
      ) : view === "search" ? (
        <SearchPage query={query} pages={pages} onQueryChange={handleSearchChange} onSelect={handleSelect} onOpenPageMenu={handleOpenPageMenu} onOpenSidebar={() => setSidebarOpen(true)} />
      ) : view === "all" || view === "favorites" || view === "folder" ? (
        <LibraryPage
          key={`${view}-${activeFolderId}`}
          title={view === "favorites" ? "즐겨찾기" : "모든 노트"}
          pages={view === "favorites" ? favoritePages : pages}
          allFolders={workspaceFolders}
          folderFilter={view === "folder" ? activeFolder?.name ?? "" : ""}
          selectedId={selectedId}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onUpdatePage={handleUpdatePage}
          onOpenPageMenu={handleOpenPageMenu}
          tagColors={tagColors}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      ) : view === "tags" ? (
        <TagsPage
          pages={pages}
          tagEntities={tagEntities}
          selectedId={selectedId}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          onSelect={handleSelect}
          onAddTag={handleAddTag}
          onRenameTag={handleRenameTag}
          onDeleteTag={handleDeleteTag}
          onSetTagColor={handleSetTagColor}
          onOpenPageMenu={handleOpenPageMenu}
          tagColors={tagColors}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      ) : view === "trash" ? (
        <TrashPage
          pages={trashPages}
          loading={trashLoading}
          onRestore={handleRestoreTrash}
          onRemove={handleRemoveTrash}
          onEmpty={handleEmptyTrash}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      ) : view === "templates" ? (
        <TemplateGallery onCreate={handleCreateFromTemplate} onCancel={() => setView("editor")} onOpenSidebar={() => setSidebarOpen(true)} />
      ) : draft ? (
        <Suspense fallback={<main className="editor-shell"><div className="editor-loading">편집기를 준비하는 중...</div></main>}>
          <Editor key={draft.id} page={draft} folders={workspaceFolders} saveState={saveState} settings={editorSettings} onChange={handleDraftChange} onDelete={handleDelete} onRestoreVersion={handleRestoreVersion} onOpenSidebar={() => setSidebarOpen(true)} />
        </Suspense>
      ) : (
        <EmptyState hasPages={hasPages} onCreate={handleCreate} onCreateTemplate={() => setView("templates")} onOpenSidebar={() => setSidebarOpen(true)} />
      )}
      <PageContextMenu
        page={contextMenuPage}
        position={pageMenu}
        folders={workspaceFolders}
        onClose={closePageMenu}
        onRename={handleRenamePage}
        onToggleFavorite={handleTogglePageFavorite}
        onDuplicate={handleDuplicatePage}
        onCopyLink={handleCopyPageLink}
        onOpenNewTab={handleOpenPageInNewTab}
        onMove={handleMovePage}
        onDelete={handleRequestDeletePage}
      />
      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="페이지를 휴지통으로 이동할까요?"
        description={`“${deleteCandidate?.title || "제목 없는 페이지"}”은 30일 동안 복원할 수 있습니다.`}
        confirmLabel="휴지통으로 이동"
        danger
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
      <ConfirmDialog
        open={Boolean(folderDeleteCandidate)}
        title="폴더를 삭제할까요?"
        description={`“${folderDeleteCandidate?.name || "폴더"}” 안의 페이지는 삭제되지 않고 미분류로 이동합니다.`}
        confirmLabel="폴더 삭제"
        danger
        busy={deletingFolder}
        onConfirm={confirmDeleteFolder}
        onCancel={() => setFolderDeleteCandidate(null)}
      />
      {showMobileTabs && <MobileBottomNav view={view} onNavigate={handleNavigate} onOpenSettings={handleOpenSettings} />}
    </div>
  );
}
