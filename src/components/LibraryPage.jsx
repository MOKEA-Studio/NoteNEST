import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Folder,
  Grid2X2,
  List,
  MoreVertical,
  Plus,
  Search,
  Star,
  Tag,
  X,
} from "lucide-react";
import { MobileMenuButton } from "./Sidebar";
import PageGlyph from "./PageGlyph";
import {
  formatDateTime,
  formatRelativeDate,
  pageExcerpt,
  pageTitle,
  tagTone,
} from "../utils";

function NoteTableRow({ page, active, tagColors, onInspect, onOpen }) {
  return (
    <div className={`note-table-row ${active ? "is-active" : ""}`}>
      <button className="note-title-cell" type="button" onClick={() => onInspect(page.id)} onDoubleClick={() => onOpen(page)}>
        <PageGlyph page={page} size={17} />
        <span>{pageTitle(page)}</span>
      </button>
      <span className="note-folder-cell"><Folder size={15} /> {page.folder || "미분류"}</span>
      <span className="note-tag-cell">
        {page.tags?.[0] ? <span className={`tag-chip tone-${tagTone(page.tags[0], tagColors)}`}><Tag size={13} />{page.tags[0]}</span> : <span className="empty-cell">-</span>}
      </span>
      <span className="note-date-cell">{formatRelativeDate(page.updatedAt)}</span>
      <button className="row-action" type="button" aria-label={`${pageTitle(page)} 열기`} title="페이지 열기" onClick={() => onOpen(page)}>
        <MoreVertical size={17} />
      </button>
    </div>
  );
}

function NoteCard({ page, active, onInspect, onOpen }) {
  return (
    <article className={`note-card ${active ? "is-active" : ""}`}>
      <button className="note-card-main" type="button" onClick={() => onInspect(page.id)} onDoubleClick={() => onOpen(page)}>
        <PageGlyph page={page} size={20} />
        <strong>{pageTitle(page)}</strong>
        <p>{pageExcerpt(page, 100)}</p>
      </button>
      <footer>
        <span><Folder size={14} /> {page.folder || "미분류"}</span>
        <button type="button" aria-label={`${pageTitle(page)} 열기`} title="페이지 열기" onClick={() => onOpen(page)}><ArrowUpRight size={16} /></button>
      </footer>
    </article>
  );
}

export default function LibraryPage({
  title,
  pages,
  allFolders,
  folderFilter = "",
  selectedId,
  onSelect,
  onCreate,
  onUpdatePage,
  tagColors = {},
  onOpenSidebar,
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("updated-desc");
  const [mode, setMode] = useState("list");
  const [searchOpen, setSearchOpen] = useState(false);
  const [inspectedId, setInspectedId] = useState(() => (
    window.matchMedia("(max-width: 760px)").matches ? null : selectedId
  ));

  const visiblePages = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("ko-KR");
    const result = pages.filter((page) => {
      if (folderFilter && (page.folder || "미분류") !== folderFilter) return false;
      if (!keyword) return true;
      return [page.title, page.content, page.folder, ...(page.tags ?? [])]
        .some((value) => value?.toLocaleLowerCase("ko-KR").includes(keyword));
    });
    return result.sort((left, right) => {
      if (sort === "updated-asc") return new Date(left.updatedAt) - new Date(right.updatedAt);
      if (sort === "title") return pageTitle(left).localeCompare(pageTitle(right), "ko-KR");
      return new Date(right.updatedAt) - new Date(left.updatedAt);
    });
  }, [folderFilter, pages, query, sort]);

  useEffect(() => {
    if (inspectedId === null) return;
    if (visiblePages.some((page) => page.id === inspectedId)) return;
    setInspectedId(visiblePages[0]?.id ?? null);
  }, [inspectedId, visiblePages]);

  const inspectedPage = visiblePages.find((page) => page.id === inspectedId) ?? null;
  const heading = folderFilter || title;

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div className="workspace-title-row">
          <MobileMenuButton onClick={onOpenSidebar} />
          <h1>{heading}</h1>
          <span>{visiblePages.length}개</span>
        </div>
        <button className="primary-button compact-primary" type="button" onClick={() => onCreate(folderFilter || undefined)}>
          <Plus size={16} /> 새 페이지
        </button>
      </header>

      <div className={`library-layout ${inspectedPage ? "has-inspector" : ""}`}>
        <section className="library-main" aria-label={heading}>
          <div className="library-toolbar">
            <div className="library-location">
              <Folder size={17} />
              <span>{folderFilter ? `모든 노트 / ${folderFilter}` : heading}</span>
            </div>
            <div className="library-controls">
              {searchOpen && (
                <label className="inline-search">
                  <Search size={16} />
                  <input autoFocus value={query} aria-label="노트 검색" placeholder="노트 검색" onChange={(event) => setQuery(event.target.value)} />
                  {query && <button type="button" aria-label="검색어 지우기" onClick={() => setQuery("")}><X size={14} /></button>}
                </label>
              )}
              <button className={`tool-square ${searchOpen ? "is-active" : ""}`} type="button" aria-label="노트 검색" title="노트 검색" onClick={() => setSearchOpen((current) => !current)}><Search size={18} /></button>
              <div className="view-switch" role="group" aria-label="보기 방식">
                <button className={mode === "list" ? "is-active" : ""} type="button" aria-label="목록 보기" title="목록 보기" aria-pressed={mode === "list"} onClick={() => setMode("list")}><List size={18} /></button>
                <button className={mode === "grid" ? "is-active" : ""} type="button" aria-label="격자 보기" title="격자 보기" aria-pressed={mode === "grid"} onClick={() => setMode("grid")}><Grid2X2 size={17} /></button>
              </div>
              <label className="sort-select">
                <span className="sr-only">정렬</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="updated-desc">최근 수정순</option>
                  <option value="updated-asc">오래된 순</option>
                  <option value="title">제목순</option>
                </select>
                <ChevronDown size={15} aria-hidden="true" />
              </label>
            </div>
          </div>

          {visiblePages.length === 0 ? (
            <div className="collection-empty">
              <PageGlyph page={{}} size={29} />
              <h2>{query ? "검색 결과가 없습니다" : "이곳에 노트가 없습니다"}</h2>
              <button className="primary-button" type="button" onClick={() => onCreate(folderFilter || undefined)}><Plus size={16} /> 새 페이지 만들기</button>
            </div>
          ) : mode === "list" ? (
            <div className="note-table">
              <div className="note-table-head" aria-hidden="true">
                <span>제목</span><span>폴더</span><span>태그</span><span>수정일</span><span />
              </div>
              <div className="note-table-body">
                {visiblePages.map((page) => (
                  <NoteTableRow key={page.id} page={page} active={page.id === inspectedId} tagColors={tagColors} onInspect={setInspectedId} onOpen={onSelect} />
                ))}
              </div>
            </div>
          ) : (
            <div className="note-grid">
              {visiblePages.map((page) => (
                <NoteCard key={page.id} page={page} active={page.id === inspectedId} onInspect={setInspectedId} onOpen={onSelect} />
              ))}
            </div>
          )}
        </section>

        {inspectedPage && (
          <aside className="note-inspector" aria-label="선택한 노트">
            <div className="inspector-heading">
              <span>선택한 노트</span>
              <button type="button" aria-label="상세 패널 닫기" title="상세 패널 닫기" onClick={() => setInspectedId(null)}><X size={17} /></button>
            </div>
            <div className="inspector-title"><PageGlyph page={inspectedPage} size={20} /><strong>{pageTitle(inspectedPage)}</strong></div>
            <dl className="inspector-properties">
              <div><dt>폴더</dt><dd><label className="inspector-folder"><Folder size={15} /><select value={inspectedPage.folder || ""} onChange={(event) => onUpdatePage(inspectedPage, { folder: event.target.value })}>{[...new Set([inspectedPage.folder, ...allFolders].filter(Boolean))].map((folder) => <option key={folder} value={folder}>{folder}</option>)}</select></label></dd></div>
              <div><dt>태그</dt><dd>{inspectedPage.tags?.length ? inspectedPage.tags.map((tag) => <span key={tag} className={`tag-chip tone-${tagTone(tag, tagColors)}`}>{tag}</span>) : "없음"}</dd></div>
              <div><dt>수정일</dt><dd>{formatDateTime(inspectedPage.updatedAt)}</dd></div>
              <div><dt>생성일</dt><dd>{formatDateTime(inspectedPage.createdAt)}</dd></div>
              <div><dt>상태</dt><dd className="local-saved"><CheckCircle2 size={15} /> 로컬에 저장됨</dd></div>
            </dl>
            <div className="inspector-preview"><p>{pageExcerpt(inspectedPage, 220)}</p></div>
            <button className="inspector-open" type="button" onClick={() => onSelect(inspectedPage)}><ArrowUpRight size={16} /> 페이지 열기</button>
            <button className={`inspector-favorite ${inspectedPage.favorite ? "is-active" : ""}`} type="button" onClick={() => onUpdatePage(inspectedPage, { favorite: !inspectedPage.favorite })}><Star size={16} fill={inspectedPage.favorite ? "currentColor" : "none"} /> {inspectedPage.favorite ? "즐겨찾기 해제" : "즐겨찾기에 추가"}</button>
          </aside>
        )}
      </div>
    </main>
  );
}
