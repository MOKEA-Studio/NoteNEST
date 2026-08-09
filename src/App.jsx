import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { pagesApi, settingsApi } from "./api";
import EmptyState from "./components/EmptyState";
import LibraryPage from "./components/LibraryPage";
import SearchPage from "./components/SearchPage";
import SettingsPage from "./components/SettingsPage";
import Sidebar from "./components/Sidebar";
import TagsPage from "./components/TagsPage";
import { normalizeTags } from "./utils";

const Editor = lazy(() => import("./components/Editor"));

const defaultSettings = {
  fontFamily: "system",
  fontSize: 16,
  editorWidth: "standard",
  customFonts: [],
};

const starterDocument = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "이번에 이루고 싶은 것" }] },
    { type: "paragraph", content: [{ type: "text", text: "핵심 목표와 다음 행동을 자유롭게 정리해보세요." }] },
    {
      type: "taskList",
      content: [
        { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "첫 번째 할 일" }] }] },
        { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "두 번째 할 일" }] }] },
      ],
    },
  ],
};

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
  const [folderFilter, setFolderFilter] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [settings, setSettings] = useState(defaultSettings);
  const lastSavedRef = useRef("");
  const saveSequenceRef = useRef(0);
  const saveTimerRef = useRef(null);
  const saveQueueRef = useRef(Promise.resolve());

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
      if (data.length > 0) {
        setDraft((current) => {
          const selected = data.find((page) => page.id === current?.id) ?? data[0];
          lastSavedRef.current = pageSignature(selected);
          return selected;
        });
      } else {
        setDraft(null);
        lastSavedRef.current = "";
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  useEffect(() => {
    settingsApi.get()
      .then(setSettings)
      .catch((requestError) => setError(requestError.message));
  }, []);

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
    if (!draft) return undefined;
    const signature = pageSignature(draft);
    if (signature === lastSavedRef.current) return undefined;

    const sequence = ++saveSequenceRef.current;
    setSaveState("saving");
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const saved = await queuePageSave(draft);
        if (sequence !== saveSequenceRef.current) return;
        lastSavedRef.current = pageSignature(saved);
        setDraft(saved);
        setPages((current) => sortByUpdatedAt(
          current.some((page) => page.id === saved.id)
            ? current.map((page) => (page.id === saved.id ? saved : page))
            : [saved, ...current],
        ));
        setSaveState("saved");
      } catch {
        if (sequence === saveSequenceRef.current) setSaveState("error");
      }
    }, 700);

    return () => {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    };
  }, [draft]);

  const selectedId = draft?.id ?? null;
  const hasPages = pages.length > 0;
  const folders = useMemo(() => [...new Set(pages.map((page) => page.folder?.trim() || "미분류"))].sort((left, right) => left.localeCompare(right, "ko-KR")), [pages]);
  const favoritePages = useMemo(() => pages.filter((page) => page.favorite), [pages]);

  async function flushDraft() {
    if (!draft || pageSignature(draft) === lastSavedRef.current) return true;
    window.clearTimeout(saveTimerRef.current);
    saveSequenceRef.current += 1;
    setSaveState("saving");
    try {
      const saved = await queuePageSave(draft);
      lastSavedRef.current = pageSignature(saved);
      setDraft(saved);
      setPages((current) => sortByUpdatedAt(current.map((page) => (page.id === saved.id ? saved : page))));
      setSaveState("saved");
      return true;
    } catch (requestError) {
      setSaveState("error");
      setError(requestError.message);
      return false;
    }
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

  async function handleCreateTemplate() {
    if (!(await flushDraft())) return;
    try {
      const created = await pagesApi.create();
      const page = await pagesApi.update(created.id, {
        title: "새 프로젝트",
        content: "이번에 이루고 싶은 것\n핵심 목표와 다음 행동을 자유롭게 정리해보세요.\n첫 번째 할 일\n두 번째 할 일",
        blocks: starterDocument,
        folder: "프로젝트",
        tags: ["템플릿"],
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
    if (!draft) return;
    if (!window.confirm(`“${draft.title || "제목 없는 페이지"}” 페이지를 삭제할까요?`)) return;
    try {
      await pagesApi.remove(draft.id);
      const remaining = pages.filter((page) => page.id !== draft.id);
      const nextPage = remaining[0] ?? null;
      setPages(remaining);
      setDraft(nextPage);
      lastSavedRef.current = nextPage ? pageSignature(nextPage) : "";
      setSaveState("saved");
      if (!nextPage) setView("editor");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function handleNavigate(nextView) {
    if (nextView === "home") {
      setView("editor");
      setSidebarOpen(false);
      return;
    }
    if (nextView === "all") setFolderFilter("");
    setView(nextView);
    if (nextView !== "search") setSidebarOpen(false);
  }

  function handleOpenFolder(folder) {
    setFolderFilter(folder);
    setView("all");
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
    setSettings(saved);
  }

  async function handleAddTag(tag, pageId) {
    if (!(await flushDraft())) return;
    const page = pages.find((item) => item.id === pageId) ?? (draft?.id === pageId ? draft : null);
    if (!page) return;
    try {
      const saved = await pagesApi.update(page.id, { tags: normalizeTags([...(page.tags ?? []), tag]) });
      replaceSavedPages([saved]);
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleRenameTag(tag, nextName) {
    if (!(await flushDraft())) return;
    const affected = pages.filter((page) => page.tags?.includes(tag));
    try {
      const saved = await Promise.all(affected.map((page) => pagesApi.update(page.id, {
        tags: normalizeTags(page.tags.map((item) => (item === tag ? nextName : item))),
      })));
      replaceSavedPages(saved);
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleDeleteTag(tag) {
    if (!window.confirm(`“${tag}” 태그를 모든 노트에서 삭제할까요?`)) return;
    if (!(await flushDraft())) return;
    const affected = pages.filter((page) => page.tags?.includes(tag));
    try {
      const saved = await Promise.all(affected.map((page) => pagesApi.update(page.id, {
        tags: page.tags.filter((item) => item !== tag),
      })));
      replaceSavedPages(saved);
      setSelectedTag("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        pages={pages}
        selectedId={selectedId}
        query={query}
        loading={loading}
        view={view}
        folderFilter={folderFilter}
        onQueryChange={handleSearchChange}
        onCreate={handleCreate}
        onCreateFolder={handleCreateFolder}
        onSelect={handleSelect}
        onNavigate={handleNavigate}
        onOpenFolder={handleOpenFolder}
        onOpenSettings={handleOpenSettings}
        onClose={() => setSidebarOpen(false)}
      />

      {error && (
        <div className="error-banner" role="alert">
          <AlertCircle aria-hidden="true" size={17} />
          <span>{error}</span>
          <button type="button" onClick={loadPages}><RefreshCw aria-hidden="true" size={15} /> 다시 시도</button>
        </div>
      )}

      {view === "settings" ? (
        <SettingsPage settings={settings} onSave={handleSaveSettings} onBack={() => setView("editor")} onOpenSidebar={() => setSidebarOpen(true)} />
      ) : view === "search" ? (
        <SearchPage query={query} pages={pages} onQueryChange={handleSearchChange} onSelect={handleSelect} onOpenSidebar={() => setSidebarOpen(true)} />
      ) : view === "all" || view === "favorites" ? (
        <LibraryPage
          title={view === "favorites" ? "즐겨찾기" : "모든 노트"}
          pages={view === "favorites" ? favoritePages : pages}
          allFolders={folders}
          folderFilter={view === "all" ? folderFilter : ""}
          selectedId={selectedId}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onUpdatePage={handleUpdatePage}
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
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      ) : draft ? (
        <Suspense fallback={<main className="editor-shell"><div className="editor-loading">편집기를 준비하는 중...</div></main>}>
          <Editor page={draft} folders={folders} saveState={saveState} settings={settings} onChange={handleDraftChange} onDelete={handleDelete} onOpenSidebar={() => setSidebarOpen(true)} />
        </Suspense>
      ) : (
        <EmptyState hasPages={hasPages} onCreate={handleCreate} onCreateTemplate={handleCreateTemplate} onOpenSidebar={() => setSidebarOpen(true)} />
      )}
    </div>
  );
}
