import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, FilePlus2, Folder, LoaderCircle, Pencil, Trash2, X } from "lucide-react";

const menuWidth = 232;
const menuHeight = 218;
const viewportPadding = 8;

function menuPosition(position) {
  return {
    left: Math.max(viewportPadding, Math.min(position.x, window.innerWidth - menuWidth - viewportPadding)),
    top: Math.max(viewportPadding, Math.min(position.y, window.innerHeight - menuHeight - viewportPadding)),
  };
}

export default function FolderContextMenu({ folder, position, onClose, onCreatePage, onRename, onDelete }) {
  const menuRef = useRef(null);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!folder) return undefined;
    setRenaming(false);
    setName(folder.name);
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
  }, [folder, onClose]);

  if (!folder || !position) return null;

  async function runAction(action) {
    setBusy(true);
    try {
      await action();
      onClose();
    } catch {
      setBusy(false);
    }
  }

  async function submitRename(event) {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName || nextName === folder.name) {
      onClose();
      return;
    }
    await runAction(() => onRename(folder, nextName));
  }

  return createPortal(
    <div ref={menuRef} className="folder-context-menu" role="menu" aria-label={`${folder.name} 폴더 메뉴`} aria-busy={busy} style={menuPosition(position)}>
      <div className="folder-context-heading">
        <Folder size={18} />
        <span><strong>{folder.name}</strong><small>{folder.pageCount}개 페이지</small></span>
        {busy && <LoaderCircle className="spin" size={15} aria-label="처리 중" />}
      </div>
      {renaming ? (
        <form className="folder-context-rename" onSubmit={submitRename}>
          <label><span className="sr-only">폴더 이름</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label>
          <div>
            <button type="submit" aria-label="이름 저장" title="이름 저장" disabled={busy || !name.trim()}><Check size={15} /></button>
            <button type="button" aria-label="취소" title="취소" disabled={busy} onClick={() => setRenaming(false)}><X size={15} /></button>
          </div>
        </form>
      ) : (
        <>
          <button type="button" role="menuitem" disabled={busy} onClick={() => runAction(() => onCreatePage(folder))}><FilePlus2 size={16} /><span>새 페이지</span></button>
          <button type="button" role="menuitem" disabled={busy} onClick={() => setRenaming(true)}><Pencil size={16} /><span>이름 변경</span></button>
          <div className="folder-context-separator" role="separator" />
          <button className="is-danger" type="button" role="menuitem" disabled={busy} onClick={() => runAction(() => onDelete(folder))}><Trash2 size={16} /><span>폴더 삭제</span></button>
        </>
      )}
    </div>,
    document.body,
  );
}
