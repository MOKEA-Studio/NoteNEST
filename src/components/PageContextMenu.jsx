import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, LoaderCircle, Pencil, Star, Trash2, X } from "lucide-react";
import PageGlyph from "./PageGlyph";
import { pageTitle } from "../utils";

const menuWidth = 238;
const menuHeight = 294;
const viewportPadding = 8;

function menuPosition(position) {
  return {
    left: Math.max(viewportPadding, Math.min(position.x, window.innerWidth - menuWidth - viewportPadding)),
    top: Math.max(viewportPadding, Math.min(position.y, window.innerHeight - menuHeight - viewportPadding)),
  };
}

export default function PageContextMenu({ page, position, onClose, onRename, onToggleFavorite, onDuplicate, onDelete }) {
  const menuRef = useRef(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!page) return undefined;
    setRenaming(false);
    setRenameValue(pageTitle(page));
    setBusy(false);

    const focusTimer = window.setTimeout(() => menuRef.current?.querySelector("button, input")?.focus(), 0);
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) onClose();
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    function closeOnViewportChange() {
      onClose();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [onClose, page]);

  if (!page || !position) return null;

  async function runAction(action) {
    setBusy(true);
    try {
      await action();
      setBusy(false);
      onClose();
    } catch {
      setBusy(false);
    }
  }

  async function submitRename(event) {
    event.preventDefault();
    const title = renameValue.trim();
    if (!title || title === pageTitle(page)) {
      onClose();
      return;
    }
    await runAction(() => onRename(page, title));
  }

  return createPortal(
    <div
      ref={menuRef}
      className="page-context-menu"
      role="menu"
      aria-label={`${pageTitle(page)} 페이지 메뉴`}
      aria-busy={busy}
      style={menuPosition(position)}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="page-context-heading">
        <PageGlyph page={page} size={19} />
        <span><strong>{pageTitle(page)}</strong><small>{page.folder || "미분류"}</small></span>
        {busy && <LoaderCircle className="spin" size={15} aria-label="처리 중" />}
      </div>

      {renaming ? (
        <form className="page-context-rename" onSubmit={submitRename}>
          <label><span>페이지 이름</span><input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} /></label>
          <div>
            <button type="submit" aria-label="이름 저장" title="이름 저장" disabled={busy || !renameValue.trim()}><Check size={15} /></button>
            <button type="button" aria-label="이름 변경 취소" title="취소" disabled={busy} onClick={() => setRenaming(false)}><X size={15} /></button>
          </div>
        </form>
      ) : (
        <>
          <button type="button" role="menuitem" disabled={busy} onClick={() => setRenaming(true)}><Pencil size={16} /><span>이름 변경</span></button>
          <button type="button" role="menuitem" disabled={busy} onClick={() => runAction(() => onToggleFavorite(page))}>
            <Star size={16} fill={page.favorite ? "currentColor" : "none"} /><span>{page.favorite ? "즐겨찾기 해제" : "즐겨찾기에 추가"}</span>
          </button>
          <button type="button" role="menuitem" disabled={busy} onClick={() => runAction(() => onDuplicate(page))}><Copy size={16} /><span>복제</span></button>
          <div className="page-context-separator" role="separator" />
          <button className="is-danger" type="button" role="menuitem" disabled={busy} onClick={() => runAction(() => onDelete(page))}><Trash2 size={16} /><span>휴지통으로 이동</span></button>
        </>
      )}
    </div>,
    document.body,
  );
}
