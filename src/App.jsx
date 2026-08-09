import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { pagesApi, settingsApi, trashApi, versionsApi } from "./api";
import ConfirmDialog from "./components/ConfirmDialog";
import EmptyState from "./components/EmptyState";
import LibraryPage from "./components/LibraryPage";
import SearchPage from "./components/SearchPage";
import SettingsPage from "./components/SettingsPage";
import Sidebar from "./components/Sidebar";
import TagsPage from "./components/TagsPage";
import TemplateGallery from "./components/TemplateGallery";
import TrashPage from "./components/TrashPage";
import MobileBottomNav from "./components/MobileBottomNav";
import { templatePlainText } from "./templates";
import { normalizeTags, tagTone } from "./utils";

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
  const [view, setView] = useState("editor");
  const [selectedTag, setSelectedTag] = useState("");
  const [settings, setSettings] = useState(defaultSettings);
  const [trashPages, setTrashPages] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [connected, setConnected] = useState(true);
  const [recoveredDraft, setRecoveredDraft] = useState(false);
  const [retrySequence, setRetrySequence] = useState(0);
  const lastSavedRef = useRef("");
  const draftRef = useRef(null);
  const saveSequenceRef = useRef(0);
  const saveTimerRef = useRef(null);
  const saveQueueRef = useRef(Promise.resolve());

  draftRef.current = draft;

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
        const cachedPage = pending ? data.find((page) => page.id === pending.page.id) : null;
        const serverPage = cachedPage ?? data.find((page) => page.id === current?.id) ?? data[0];
        const canRecover = cachedPage && pageSignature(pending.page) !== pageSignature(cachedPage);
        const selected = canRecover ? { ...cachedPage, ...pageChanges(pending.page) } : serverPage;
        lastSavedRef.current = pageSignature(serverPage);
        setDraft(selected);
        setRecoveredDraft(Boolean(canRecover));
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

  function reloadWorkspace() {
    loadPages();
    loadSettings();
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
  const folders = useMemo(() => [...new Set(pages.map((page) => page.folder?.trim() || "미분류"))].sort((left, right) => left.localeCompare(right, "ko-KR")), [pages]);
  const favoritePages = useMemo(() => pages.filter((page) => page.favorite), [pages]);

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

  async function handleCreate(folder) {
    if (!(await flushDraft())) return;
    try {
      let page = await pagesApi.create();
      const targetFolder = typeof folder === "string" ? folder.trim() : "";
      if (targetFolder && targetFolder !== page.folder) {
        page = await pagesApi.update(page.id, { folder: targetFolder });
      }
      setQuery("");
      setPages((current) => [page, ...current]);
      setDraft(page);
      lastSavedRef.current = pageSignature(page);
      setSaveState("saved");
      setSidebarOpen(false);
      setView("editor");
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleCreateFolder(folder) {
    if (folder.trim()) await handleCreate(folder.trim());
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
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleSelect(page) {
    if (page.id === draft?.id) {
      setSidebarOpen(false);
      setView("editor");
      return;
    }
    if (!(await flushDraft())) return;
    saveSequenceRef.current += 1;
    setDraft(page);
    lastSavedRef.current = pageSignature(page);
    setSaveState("saved");
    setSidebarOpen(false);
    setView("editor");
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

  async function handleDelete() {
    if (!draft || !(await flushDraft())) return;
    setDeleteCandidate(draft);
  }

  async function confirmDelete() {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await pagesApi.remove(deleteCandidate.id);
      clearPendingDraft(deleteCandidate.id);
      const remaining = pages.filter((page) => page.id !== deleteCandidate.id);
      const nextPage = remaining[0] ?? null;
      setPages(remaining);
      setDraft(nextPage);
      lastSavedRef.current = nextPage ? pageSignature(nextPage) : "";
      setSaveState("saved");
      setRecoveredDraft(false);
      if (!nextPage) setView("editor");
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
      return restored;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  function handleNavigate(nextView) {
    if (nextView === "home") {
      setView("editor");
      setSidebarOpen(false);
      return;
    }
    if (nextView === "trash") loadTrash();
    setView(nextView);
    if (nextView !== "search") setSidebarOpen(false);
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

  async function saveTagColors(tagColors) {
    try {
      const saved = await settingsApi.update({ ...settings, tagColors });
      setSettings({ ...defaultSettings, ...saved, tagColors: saved.tagColors ?? {} });
      setError("");
      return saved;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
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
      setSaveState("saved");
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
      const saved = await pagesApi.update(page.id, { tags: normalizeTags([...(page.tags ?? []), tag]) });
      replaceSavedPages([saved]);
      await saveTagColors({
        ...(settings.tagColors ?? {}),
        [tag]: tagTone(tag, { [tag]: tone }),
      });
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleRenameTag(tag, nextName) {
    if (!(await flushDraft())) return;
    const affected = pages.filter((page) => page.tags?.includes(tag));
    const currentTagColors = settings.tagColors ?? {};
    const targetExists = pages.some((page) => page.tags?.includes(nextName));
    const nextTagColors = { ...currentTagColors };
    const nextTone = targetExists ? tagTone(nextName, currentTagColors) : tagTone(tag, currentTagColors);
    delete nextTagColors[tag];
    nextTagColors[nextName] = nextTone;
    try {
      const saved = await Promise.all(affected.map((page) => pagesApi.update(page.id, {
        tags: normalizeTags(page.tags.map((item) => (item === tag ? nextName : item))),
      })));
      replaceSavedPages(saved);
      await saveTagColors(nextTagColors);
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleDeleteTag(tag) {
    if (!window.confirm(`“${tag}” 태그를 모든 노트에서 삭제할까요?`)) return;
    if (!(await flushDraft())) return;
    const affected = pages.filter((page) => page.tags?.includes(tag));
    const nextTagColors = { ...(settings.tagColors ?? {}) };
    delete nextTagColors[tag];
    try {
      const saved = await Promise.all(affected.map((page) => pagesApi.update(page.id, {
        tags: page.tags.filter((item) => item !== tag),
      })));
      replaceSavedPages(saved);
      await saveTagColors(nextTagColors);
      setSelectedTag("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleSetTagColor(tag, tone) {
    await saveTagColors({ ...(settings.tagColors ?? {}), [tag]: tone });
  }

  const showRecovery = Boolean(draft) && (!connected || recoveredDraft || saveState === "offline");
  const showMobileTabs = ["all", "favorites", "tags", "search", "trash", "settings"].includes(view) || (view === "editor" && !draft);

  return (
    <div className={`app-shell ${showRecovery ? "has-recovery-banner" : ""} ${showMobileTabs ? "has-mobile-tabs" : ""}`} data-view={view}>
      <Sidebar
        open={sidebarOpen}
        pages={pages}
        selectedId={selectedId}
        query={query}
        loading={loading}
        view={view}
        onQueryChange={handleSearchChange}
        onCreate={handleCreate}
        onCreateFolder={handleCreateFolder}
        onSelect={handleSelect}
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

      {view === "settings" ? (
        <SettingsPage settings={settings} pages={pages} currentPage={draft} onSave={handleSaveSettings} onImport={handleImportPages} onBack={() => setView("editor")} onOpenSidebar={() => setSidebarOpen(true)} />
      ) : view === "search" ? (
        <SearchPage query={query} pages={pages} onQueryChange={handleSearchChange} onSelect={handleSelect} onOpenSidebar={() => setSidebarOpen(true)} />
      ) : view === "all" || view === "favorites" ? (
        <LibraryPage
          key={view}
          title={view === "favorites" ? "즐겨찾기" : "모든 노트"}
          pages={view === "favorites" ? favoritePages : pages}
          allFolders={folders}
          selectedId={selectedId}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onUpdatePage={handleUpdatePage}
          tagColors={settings.tagColors}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      ) : view === "tags" ? (
        <TagsPage
          pages={pages}
          selectedId={selectedId}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          onSelect={handleSelect}
          onAddTag={handleAddTag}
          onRenameTag={handleRenameTag}
          onDeleteTag={handleDeleteTag}
          onSetTagColor={handleSetTagColor}
          tagColors={settings.tagColors}
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
          <Editor key={draft.id} page={draft} folders={folders} saveState={saveState} settings={settings} onChange={handleDraftChange} onDelete={handleDelete} onRestoreVersion={handleRestoreVersion} onOpenSidebar={() => setSidebarOpen(true)} />
        </Suspense>
      ) : (
        <EmptyState hasPages={hasPages} onCreate={handleCreate} onCreateTemplate={() => setView("templates")} onOpenSidebar={() => setSidebarOpen(true)} />
      )}
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
      {showMobileTabs && <MobileBottomNav view={view} onNavigate={handleNavigate} onOpenSettings={handleOpenSettings} />}
    </div>
  );
}
