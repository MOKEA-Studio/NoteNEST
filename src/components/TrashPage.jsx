import { useMemo, useState } from "react";
import { RotateCcw, Search, Trash2, X } from "lucide-react";
import { MobileMenuButton } from "./Sidebar";
import ConfirmDialog from "./ConfirmDialog";
import PageGlyph from "./PageGlyph";
import { formatShortDate, pageTitle } from "../utils";

function remainingDays(value) {
  const deletedAt = new Date(value).getTime();
  return Math.max(0, 30 - Math.floor((Date.now() - deletedAt) / 86_400_000));
}

export default function TrashPage({ pages, loading, onRestore, onRemove, onEmpty, onOpenSidebar }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [confirmAction, setConfirmAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const visiblePages = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("ko-KR");
    return keyword ? pages.filter((page) => [page.title, page.folder].some((value) => value?.toLocaleLowerCase("ko-KR").includes(keyword))) : pages;
  }, [pages, query]);

  function togglePage(id) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((current) => current.size === visiblePages.length ? new Set() : new Set(visiblePages.map((page) => page.id)));
  }

  async function runConfirmedAction() {
    setBusy(true);
    try {
      if (confirmAction?.type === "empty") await onEmpty();
      if (confirmAction?.type === "remove") await Promise.all(confirmAction.ids.map(onRemove));
      setSelected(new Set());
      setConfirmAction(null);
    } finally {
      setBusy(false);
    }
  }

  async function restoreSelected() {
    setBusy(true);
    try {
      await Promise.all([...selected].map(onRestore));
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="workspace-shell trash-shell">
      <header className="workspace-header">
        <div className="workspace-title-row"><MobileMenuButton onClick={onOpenSidebar} /><div><h1>휴지통</h1><p>삭제된 페이지는 30일 후 영구 삭제됩니다.</p></div></div>
        <button className="trash-empty-button" type="button" disabled={!pages.length} onClick={() => setConfirmAction({ type: "empty", ids: pages.map((page) => page.id) })}><Trash2 size={17} /> 휴지통 비우기</button>
      </header>
      <section className="trash-content" aria-label="삭제된 페이지">
        <label className="trash-search"><Search size={18} /><input value={query} placeholder="휴지통 검색" aria-label="휴지통 검색" onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" aria-label="검색어 지우기" onClick={() => setQuery("")}><X size={15} /></button>}</label>
        <div className="trash-table">
          <div className="trash-table-head">
            <input type="checkbox" aria-label="모두 선택" checked={visiblePages.length > 0 && selected.size === visiblePages.length} onChange={toggleAll} />
            <span>이름</span><span>원래 위치</span><span>삭제된 날짜</span><span>남은 기간</span><span>작업</span>
          </div>
          {loading ? <div className="collection-empty"><p>휴지통을 불러오는 중...</p></div> : visiblePages.length === 0 ? (
            <div className="collection-empty"><Trash2 size={31} /><h2>{query ? "검색 결과가 없습니다" : "휴지통이 비어 있습니다"}</h2></div>
          ) : visiblePages.map((page) => (
            <div key={page.id} className={`trash-row ${selected.has(page.id) ? "is-selected" : ""}`}>
              <input type="checkbox" aria-label={`${pageTitle(page)} 선택`} checked={selected.has(page.id)} onChange={() => togglePage(page.id)} />
              <span className="trash-page-title"><PageGlyph page={page} size={17} /><strong>{pageTitle(page)}</strong></span>
              <span>{page.folder || "미분류"}</span>
              <span>{formatShortDate(page.deletedAt)} 삭제</span>
              <span>{remainingDays(page.deletedAt)}일 남음</span>
              <span className="trash-row-actions"><button type="button" aria-label={`${pageTitle(page)} 복원`} title="복원" onClick={() => onRestore(page.id)}><RotateCcw size={17} /></button><button className="danger-icon" type="button" aria-label={`${pageTitle(page)} 영구 삭제`} title="영구 삭제" onClick={() => setConfirmAction({ type: "remove", ids: [page.id] })}><Trash2 size={17} /></button></span>
            </div>
          ))}
        </div>
      </section>
      {selected.size > 0 && (
        <div className="trash-selection-bar"><strong>{selected.size}개 선택</strong><button type="button" disabled={busy} onClick={restoreSelected}><RotateCcw size={16} /> 복원</button><button className="is-danger" type="button" disabled={busy} onClick={() => setConfirmAction({ type: "remove", ids: [...selected] })}><Trash2 size={16} /> 영구 삭제</button></div>
      )}
      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.type === "empty" ? "휴지통을 비우시겠습니까?" : "영구 삭제하시겠습니까?"}
        description="이 작업은 되돌릴 수 없습니다. 선택한 페이지와 버전 기록이 함께 삭제됩니다."
        confirmLabel="영구 삭제"
        danger
        busy={busy}
        onConfirm={runConfirmedAction}
        onCancel={() => setConfirmAction(null)}
      />
    </main>
  );
}
