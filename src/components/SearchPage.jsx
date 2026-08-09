import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, MoreVertical, Search, X } from "lucide-react";
import { MobileMenuButton } from "./Sidebar";
import PageGlyph from "./PageGlyph";
import { formatDateTime, pageExcerpt, pageTitle } from "../utils";

function Highlight({ text, query }) {
  const value = String(text ?? "");
  const keyword = query.trim();
  if (!keyword) return value;
  const lowerValue = value.toLocaleLowerCase("ko-KR");
  const lowerKeyword = keyword.toLocaleLowerCase("ko-KR");
  const parts = [];
  let cursor = 0;
  let index = lowerValue.indexOf(lowerKeyword);
  while (index !== -1) {
    if (index > cursor) parts.push(value.slice(cursor, index));
    parts.push(<mark key={`${index}-${parts.length}`}>{value.slice(index, index + keyword.length)}</mark>);
    cursor = index + keyword.length;
    index = lowerValue.indexOf(lowerKeyword, cursor);
  }
  parts.push(value.slice(cursor));
  return parts;
}

function matches(page, keyword, filter) {
  if (!keyword) return true;
  const includes = (value) => String(value ?? "").toLocaleLowerCase("ko-KR").includes(keyword);
  if (filter === "title") return includes(page.title);
  if (filter === "content") return includes(page.content);
  if (filter === "tag") return page.tags?.some(includes);
  return includes(page.title) || includes(page.content) || includes(page.folder) || page.tags?.some(includes);
}

export default function SearchPage({ query, pages, onQueryChange, onSelect, onOpenSidebar }) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [dateRange, setDateRange] = useState("all");
  const [dateOpen, setDateOpen] = useState(false);
  const keyword = query.trim().toLocaleLowerCase("ko-KR");

  const results = useMemo(() => {
    const now = Date.now();
    const rangeDays = dateRange === "7" ? 7 : dateRange === "30" ? 30 : null;
    return pages
      .filter((page) => matches(page, keyword, filter))
      .filter((page) => !rangeDays || now - new Date(page.updatedAt).getTime() <= rangeDays * 86_400_000)
      .sort((left, right) => sort === "oldest" ? new Date(left.updatedAt) - new Date(right.updatedAt) : new Date(right.updatedAt) - new Date(left.updatedAt));
  }, [dateRange, filter, keyword, pages, sort]);

  return (
    <main className="workspace-shell search-shell">
      <header className="workspace-header">
        <div className="workspace-title-row"><MobileMenuButton onClick={onOpenSidebar} /><h1>검색</h1></div>
      </header>
      <div className="search-content">
        <div className="search-heading-row">
          <div>
            <h2>검색 결과</h2>
            <p>{query ? `‘${query}’에 대한 ${results.length}개의 결과` : `최근 노트 ${results.length}개`}</p>
          </div>
          <label className="search-page-field">
            <Search size={18} />
            <input value={query} placeholder="노트, 본문, 태그 검색" aria-label="전체 검색" onChange={(event) => onQueryChange(event.target.value)} />
            {query && <button type="button" aria-label="검색어 지우기" onClick={() => onQueryChange("")}><X size={16} /></button>}
          </label>
        </div>

        <div className="search-filterbar">
          <div className="search-tabs" role="group" aria-label="검색 범위">
            {[["all", "전체"], ["title", "제목"], ["content", "본문"], ["tag", "태그"]].map(([value, label]) => (
              <button key={value} className={filter === value ? "is-active" : ""} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>
            ))}
          </div>
          <div className="search-sort-controls">
            <label className="sort-select"><span className="sr-only">정렬</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">최신순</option><option value="oldest">오래된 순</option></select><ChevronDown size={15} /></label>
            <div className="date-filter-wrap">
              <button className={`tool-square ${dateRange !== "all" ? "is-active" : ""}`} type="button" aria-label="날짜 필터" title="날짜 필터" aria-expanded={dateOpen} onClick={() => setDateOpen((current) => !current)}><CalendarDays size={18} /></button>
              {dateOpen && (
                <div className="date-popover">
                  <strong>날짜</strong>
                  {[ ["all", "전체 기간"], ["30", "최근 30일"], ["7", "최근 7일"] ].map(([value, label]) => <button key={value} className={dateRange === value ? "is-active" : ""} type="button" onClick={() => { setDateRange(value); setDateOpen(false); }}>{label}</button>)}
                  <button className="date-reset" type="button" onClick={() => { setDateRange("all"); setDateOpen(false); }}>초기화</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="search-results">
          {results.length === 0 ? (
            <div className="collection-empty"><Search size={30} /><h2>일치하는 노트가 없습니다</h2></div>
          ) : results.map((page) => (
            <button key={page.id} className="search-result" type="button" onClick={() => onSelect(page)}>
              <PageGlyph page={page} size={21} />
              <span className="search-result-copy">
                <span className="search-result-title"><Highlight text={pageTitle(page)} query={query} /></span>
                <span className="search-result-path">{page.folder || "미분류"}{page.tags?.length ? ` / ${page.tags.join(", ")}` : ""}</span>
                <span className="search-result-excerpt"><Highlight text={pageExcerpt(page, 180)} query={query} /></span>
              </span>
              <time dateTime={page.updatedAt}>{formatDateTime(page.updatedAt)}</time>
              <MoreVertical size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
