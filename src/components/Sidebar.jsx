import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Files,
  Folder,
  FolderOpen,
  FolderPlus,
  Home,
  LayoutTemplate,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sprout,
  Star,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import PageGlyph from "./PageGlyph";
import FolderContextMenu from "./FolderContextMenu";
import { pageTitle } from "../utils";

const navigation = [
  { id: "home", label: "홈", icon: Home },
  { id: "all", label: "모든 노트", icon: Files },
  { id: "favorites", label: "즐겨찾기", icon: Star },
  { id: "tags", label: "태그", icon: Tags },
];

function SidebarPage({ page, active, nested = false, tabIndex, onSelect, onOpenMenu }) {
  function handleKeyDown(event) {
    if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return;
    event.preventDefault();
    onOpenMenu(event, page);
  }

  return (
    <div className={`sidebar-page-shell ${nested ? "is-nested" : ""} ${active ? "is-active" : ""}`} onContextMenu={(event) => onOpenMenu(event, page)}>
      <button
        className={`sidebar-page ${nested ? "is-nested" : ""} ${active ? "is-active" : ""}`}
        type="button"
        aria-current={active ? "page" : undefined}
        tabIndex={tabIndex}
        onClick={() => onSelect(page)}
        onKeyDown={handleKeyDown}
      >
        <PageGlyph page={page} size={15} />
        <span>{pageTitle(page)}</span>
      </button>
      <button className="sidebar-page-menu-button" type="button" tabIndex={tabIndex} aria-label={`${pageTitle(page)} 메뉴`} title="페이지 메뉴" onClick={(event) => onOpenMenu(event, page)}>
        <MoreHorizontal size={15} />
      </button>
    </div>
  );
}

export default function Sidebar({
  open,
  pages,
  folders,
  selectedId,
  query,
  loading,
  view,
  onQueryChange,
  onCreate,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onSelect,
  onOpenPageMenu,
  onNavigate,
  onOpenSettings,
  onClose,
  connected,
}) {
  const searchRef = useRef(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(() => new Set());
  const [folderMenu, setFolderMenu] = useState(null);
  const folderRows = useMemo(() => {
    const rows = folders.map((folder) => ({
      ...folder,
      pageCount: pages.filter((page) => page.folderId === folder.id).length,
    }));
    const unfiledCount = pages.filter((page) => !page.folderId).length;
    if (unfiledCount) rows.push({ id: "", name: "미분류", pageCount: unfiledCount, virtual: true });
    return rows.sort((left, right) => left.name.localeCompare(right.name, "ko-KR"));
  }, [folders, pages]);
  const recentPages = pages.slice(0, 5);
  const selectedFolder = useMemo(() => {
    const selected = pages.find((page) => page.id === selectedId);
    return selected ? selected.folderId || "__unfiled" : "";
  }, [pages, selectedId]);

  useEffect(() => {
    if (!selectedFolder) return;
    setExpandedFolders((current) => {
      if (current.has(selectedFolder)) return current;
      const next = new Set(current);
      next.add(selectedFolder);
      return next;
    });
  }, [selectedFolder, selectedId]);

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onNavigate("search");
        window.setTimeout(() => searchRef.current?.focus(), 0);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [onNavigate]);

  async function submitFolder(event) {
    event.preventDefault();
    const name = folderName.trim();
    if (!name) return;
    try {
      const created = await onCreateFolder(name);
      setExpandedFolders((current) => new Set(current).add(created.id));
      setFolderName("");
      setCreatingFolder(false);
    } catch {
      // The workspace error banner reports the failed request.
    }
  }

  function toggleFolder(folderId) {
    setExpandedFolders((current) => {
      const next = new Set(current);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }

  function openFolderMenu(event, folder) {
    event.preventDefault();
    event.stopPropagation();
    if (folder.virtual) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const fromPointer = event.type === "contextmenu" && (event.clientX !== 0 || event.clientY !== 0);
    setFolderMenu({
      folder,
      x: fromPointer ? event.clientX : rect.right + 4,
      y: fromPointer ? event.clientY : rect.bottom + 4,
    });
  }

  return (
    <>
      <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="워크스페이스 탐색">
        <div className="sidebar-topbar">
          <button className="brand" type="button" onClick={() => onNavigate("home")} aria-label="NoteNest 홈">
            <span className="brand-mark" aria-hidden="true"><Sprout size={24} strokeWidth={1.8} /></span>
            <span>NoteNest</span>
          </button>
          <button className="icon-button sidebar-close" type="button" aria-label="사이드바 닫기" title="사이드바 닫기" onClick={onClose}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="new-page-actions">
          <button className="new-page-button" type="button" onClick={() => onCreate()}>
            <Plus aria-hidden="true" size={18} />
            새 페이지
          </button>
          <button className="template-page-button" type="button" aria-label="템플릿 갤러리" title="템플릿 갤러리" onClick={() => onNavigate("templates")}>
            <LayoutTemplate aria-hidden="true" size={18} />
          </button>
        </div>

        <label className="search-field">
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">페이지 검색</span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder="페이지 검색"
            onFocus={() => onNavigate("search")}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          {!query && <kbd>⌘K</kbd>}
          {query && (
            <button className="search-clear" type="button" aria-label="검색어 지우기" onClick={() => onQueryChange("")}>
              <X size={15} />
            </button>
          )}
        </label>

        <div className="sidebar-scroll" aria-busy={loading}>
          <nav className="workspace-nav" aria-label="워크스페이스">
            {navigation.map(({ id, label, icon: Icon }) => {
              const active = view === id;
              return (
                <button key={id} className={`workspace-nav-item ${active ? "is-active" : ""}`} type="button" aria-current={active ? "page" : undefined} onClick={() => onNavigate(id)}>
                  <Icon size={18} strokeWidth={1.75} />
                  <span>{label}</span>
                  {id === "all" && <small>{pages.length}</small>}
                </button>
              );
            })}
          </nav>

          <section className="sidebar-section" aria-labelledby="folder-title">
            <div className="sidebar-section-heading">
              <h2 id="folder-title">폴더</h2>
              <button className="section-icon-button" type="button" aria-label="새 폴더" title="새 폴더" onClick={() => setCreatingFolder(true)}>
                <FolderPlus size={16} />
              </button>
            </div>
            <div className="folder-list">
              {folderRows.map((folder) => {
                const folderKey = folder.id || "__unfiled";
                const expanded = expandedFolders.has(folderKey);
                const folderPages = pages.filter((page) => folder.id ? page.folderId === folder.id : !page.folderId);
                const panelId = `folder-panel-${encodeURIComponent(folderKey)}`;
                return (
                  <div key={folderKey} className={`folder-tree-item ${expanded ? "is-expanded" : ""}`} onContextMenu={(event) => openFolderMenu(event, folder)}>
                    <div className="folder-tree-heading" onKeyDown={(event) => {
                      if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) openFolderMenu(event, folder);
                    }}>
                      <button
                        className={`folder-row ${selectedFolder === folderKey ? "has-selected" : ""}`}
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        onClick={() => toggleFolder(folderKey)}
                      >
                        <ChevronRight className="folder-chevron" size={14} strokeWidth={2} />
                        {expanded ? <FolderOpen className="folder-icon" size={17} strokeWidth={1.8} /> : <Folder className="folder-icon" size={17} strokeWidth={1.8} />}
                        <span>{folder.name}</span>
                        <small>{folder.pageCount}</small>
                      </button>
                      <button className="folder-add-page" type="button" aria-label={`${folder.name}에 페이지 추가`} title={`${folder.name}에 새 페이지`} onClick={() => onCreate(folder)}>
                        <Plus size={14} />
                      </button>
                      {!folder.virtual && <button className="folder-more-button" type="button" aria-label={`${folder.name} 폴더 메뉴`} title="폴더 메뉴" onClick={(event) => openFolderMenu(event, folder)}><MoreHorizontal size={14} /></button>}
                    </div>
                    <div id={panelId} className="folder-children-shell" role="group" aria-label={`${folder.name} 폴더 페이지`} aria-hidden={!expanded}>
                      <div className="folder-children">
                        {folderPages.map((page) => (
                          <SidebarPage
                            key={page.id}
                            page={page}
                            active={view === "editor" && selectedId === page.id}
                            nested
                            tabIndex={expanded ? 0 : -1}
                            onSelect={onSelect}
                            onOpenMenu={onOpenPageMenu}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
              {creatingFolder && (
                <form className="folder-composer" onSubmit={submitFolder}>
                  <Folder size={15} />
                  <label><span className="sr-only">새 폴더 이름</span><input autoFocus value={folderName} placeholder="폴더 이름" onChange={(event) => setFolderName(event.target.value)} /></label>
                  <button type="submit" aria-label="폴더 만들기" title="폴더 만들기"><Plus size={15} /></button>
                  <button type="button" aria-label="취소" title="취소" onClick={() => { setFolderName(""); setCreatingFolder(false); }}><X size={15} /></button>
                </form>
              )}
              {!loading && folderRows.length === 0 && <p className="sidebar-empty-copy">아직 폴더가 없습니다.</p>}
            </div>
          </section>

          {recentPages.length > 0 && (
            <section className="sidebar-section recent-section" aria-labelledby="recent-title">
              <div className="sidebar-section-heading"><h2 id="recent-title">최근 페이지</h2></div>
              <div className="sidebar-pages">
                {recentPages.map((page) => (
                  <SidebarPage key={page.id} page={page} active={view === "editor" && selectedId === page.id} onSelect={onSelect} onOpenMenu={onOpenPageMenu} />
                ))}
              </div>
            </section>
          )}
          <button className={`sidebar-trash ${view === "trash" ? "is-active" : ""}`} type="button" aria-current={view === "trash" ? "page" : undefined} onClick={() => onNavigate("trash")}>
            <Trash2 size={17} />
            휴지통
          </button>
        </div>

        <div className="sidebar-footer">
          <button className={`settings-button ${view === "settings" ? "is-active" : ""}`} type="button" aria-current={view === "settings" ? "page" : undefined} onClick={onOpenSettings}>
            <Settings aria-hidden="true" size={17} />
            설정
          </button>
          <span className={`local-status ${connected ? "" : "is-offline"}`}><span aria-hidden="true" /> {connected ? "로컬 저장소 연결됨" : "임시 저장 중"}</span>
        </div>
      </aside>
      {open && <button className="sidebar-backdrop" type="button" aria-label="사이드바 닫기" onClick={onClose} />}
      <FolderContextMenu
        folder={folderMenu?.folder}
        position={folderMenu}
        onClose={() => setFolderMenu(null)}
        onCreatePage={onCreate}
        onRename={onRenameFolder}
        onDelete={onDeleteFolder}
      />
    </>
  );
}

export function MobileMenuButton({ onClick }) {
  return (
    <button className="icon-button mobile-menu" type="button" aria-label="사이드바 열기" title="사이드바 열기" onClick={onClick}>
      <Menu aria-hidden="true" size={20} />
    </button>
  );
}
