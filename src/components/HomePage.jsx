import {
  ArrowUpRight,
  FilePlus2,
  Files,
  Folder,
  Search,
  Star,
  Tags,
} from "lucide-react";
import { formatRelativeDate, pageExcerpt, pageTitle } from "../utils";
import PageGlyph from "./PageGlyph";
import { MobileMenuButton } from "./Sidebar";

function todayLabel() {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
}

function PageList({ pages, emptyCopy, onSelect, onOpenPageMenu }) {
  if (!pages.length) return <p className="home-empty-copy">{emptyCopy}</p>;
  return (
    <div className="home-page-list">
      {pages.map((page) => (
        <button
          key={page.id}
          className="home-page-row"
          type="button"
          onClick={() => onSelect(page)}
          onContextMenu={(event) => onOpenPageMenu(event, page)}
        >
          <PageGlyph page={page} size={20} />
          <span>
            <strong>{pageTitle(page)}</strong>
            <small>{pageExcerpt(page, 74)}</small>
          </span>
          <time dateTime={page.updatedAt}>{formatRelativeDate(page.updatedAt)}</time>
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

export default function HomePage({
  pages,
  folders,
  tags,
  onCreate,
  onSelect,
  onNavigate,
  onOpenFolder,
  onOpenPageMenu,
  onOpenSidebar,
}) {
  const recentPages = pages.slice(0, 6);
  const favoritePages = pages.filter((page) => page.favorite).slice(0, 5);

  return (
    <main className="home-shell">
      <header className="home-header">
        <div className="home-heading">
          <MobileMenuButton onClick={onOpenSidebar} />
          <div>
            <p>{todayLabel()}</p>
            <h1>홈</h1>
          </div>
        </div>
        <button className="primary-button compact-primary" type="button" aria-label="새 페이지" title="새 페이지" onClick={() => onCreate()}>
          <FilePlus2 size={17} /> <span>새 페이지</span>
        </button>
      </header>

      <div className="home-scroll">
        <section className="home-command-band" aria-label="빠른 작업">
          <button type="button" onClick={() => onCreate()}><FilePlus2 size={19} /><span>새 페이지</span></button>
          <button type="button" onClick={() => onNavigate("search")}><Search size={19} /><span>검색</span></button>
          <button type="button" onClick={() => onNavigate("all")}><Files size={19} /><span>모든 노트</span></button>
          <button type="button" onClick={() => onNavigate("tags")}><Tags size={19} /><span>태그</span></button>
        </section>

        <div className="home-summary" aria-label="워크스페이스 현황">
          <span><strong>{pages.length}</strong> 페이지</span>
          <span><strong>{folders.length}</strong> 폴더</span>
          <span><strong>{tags.length}</strong> 태그</span>
          <span><strong>{pages.filter((page) => page.favorite).length}</strong> 즐겨찾기</span>
        </div>

        <div className="home-grid">
          <section className="home-section home-recent">
            <div className="home-section-heading">
              <div><Files size={18} /><h2>최근 페이지</h2></div>
              <button type="button" onClick={() => onNavigate("all")}>모두 보기</button>
            </div>
            <PageList pages={recentPages} emptyCopy="아직 작성한 페이지가 없습니다." onSelect={onSelect} onOpenPageMenu={onOpenPageMenu} />
          </section>

          <aside className="home-side-column">
            <section className="home-section">
              <div className="home-section-heading"><div><Folder size={18} /><h2>폴더</h2></div></div>
              <div className="home-folder-list">
                {folders.slice(0, 7).map((folder) => (
                  <button key={folder.id} type="button" onClick={() => onOpenFolder(folder)}>
                    <Folder size={17} />
                    <span>{folder.name}</span>
                    <small>{folder.pageCount}</small>
                  </button>
                ))}
                {!folders.length && <p className="home-empty-copy">아직 폴더가 없습니다.</p>}
              </div>
            </section>

            <section className="home-section">
              <div className="home-section-heading">
                <div><Star size={18} /><h2>즐겨찾기</h2></div>
                {favoritePages.length > 0 && <button type="button" onClick={() => onNavigate("favorites")}>모두 보기</button>}
              </div>
              <PageList pages={favoritePages} emptyCopy="즐겨찾기한 페이지가 없습니다." onSelect={onSelect} onOpenPageMenu={onOpenPageMenu} />
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
