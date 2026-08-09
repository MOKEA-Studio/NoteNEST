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
import { pageTitle } from "../utils";

const navigation = [
  { id: "home", label: "홈", icon: Home },
  { id: "all", label: "모든 노트", icon: Files },
  { id: "favorites", label: "즐겨찾기", icon: Star },
  { id: "tags", label: "태그", icon: Tags },
];

function SidebarPage({ page, active, nested = false, tabIndex, onSelect }) {
  return (
    <button
      className={`sidebar-page ${nested ? "is-nested" : ""} ${active ? "is-active" : ""}`}
      type="button"
      aria-current={active ? "page" : undefined}
      tabIndex={tabIndex}
      onClick={() => onSelect(page)}
    >
      <PageGlyph page={page} size={15} />
      <span>{pageTitle(page)}</span>
    </button>
  );
}

export default function Sidebar({
  open,
  pages,
  selectedId,
  query,
  loading,
  view,
  onQueryChange,
  onCreate,
  onCreateFolder,
  onSelect,
  onNavigate,
  onOpenSettings,
  onClose,
  connected,
}) {
  const searchRef = useRef(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(() => new Set());
  const folders = useMemo(() => {
    const counts = new Map();
    for (const page of pages) {
      const name = page.folder?.trim() || "미분류";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right, "ko-KR"));
  }, [pages]);
  const recentPages = pages.slice(0, 5);
  const selectedFolder = useMemo(() => {
    const selected = pages.find((page) => page.id === selectedId);
    return selected ? selected.folder?.trim() || "미분류" : "";
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
    await onCreateFolder(name);
    setFolderName("");
    setCreatingFolder(false);
  }

  function toggleFolder(folder) {
    setExpandedFolders((current) => {
      const next = new Set(current);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
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
              const active = id === "home" ? view === "editor" : view === id;
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
              {folders.map(([folder, count]) => {
                const expanded = expandedFolders.has(folder);
                const folderPages = pages.filter((page) => (page.folder?.trim() || "미분류") === folder);
                const panelId = `folder-panel-${encodeURIComponent(folder)}`;
                return (
                  <div key={folder} className={`folder-tree-item ${expanded ? "is-expanded" : ""}`}>
                    <div className="folder-tree-heading">
                      <button
                        className={`folder-row ${selectedFolder === folder ? "has-selected" : ""}`}
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        onClick={() => toggleFolder(folder)}
                      >
                        <ChevronRight className="folder-chevron" size={14} strokeWidth={2} />
                        {expanded ? <FolderOpen className="folder-icon" size={17} strokeWidth={1.8} /> : <Folder className="folder-icon" size={17} strokeWidth={1.8} />}
                        <span>{folder}</span>
                        <small>{count}</small>
                      </button>
                      <button className="folder-add-page" type="button" aria-label={`${folder}에 페이지 추가`} title={`${folder}에 새 페이지`} onClick={() => onCreate(folder)}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <div id={panelId} className="folder-children-shell" role="group" aria-label={`${folder} 폴더 페이지`} aria-hidden={!expanded}>
                      <div className="folder-children">
                        {folderPages.map((page) => (
                          <SidebarPage
                            key={page.id}
                            page={page}
                            active={view === "editor" && selectedId === page.id}
                            nested
                            tabIndex={expanded ? 0 : -1}
                            onSelect={onSelect}
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
              {!loading && folders.length === 0 && <p className="sidebar-empty-copy">아직 폴더가 없습니다.</p>}
            </div>
          </section>

          {recentPages.length > 0 && (
            <section className="sidebar-section recent-section" aria-labelledby="recent-title">
              <div className="sidebar-section-heading"><h2 id="recent-title">최근 페이지</h2></div>
              <div className="sidebar-pages">
                {recentPages.map((page) => (
                  <SidebarPage key={page.id} page={page} active={view === "editor" && selectedId === page.id} onSelect={onSelect} />
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
