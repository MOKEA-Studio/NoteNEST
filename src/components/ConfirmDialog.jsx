import { useEffect, useRef } from "react";
import { AlertTriangle, LoaderCircle, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onCancel();
    }}>
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description">
        <div className={`confirm-dialog-icon ${danger ? "is-danger" : ""}`} aria-hidden="true"><AlertTriangle size={22} /></div>
        <div className="confirm-dialog-copy">
          <h2 id="confirm-dialog-title">{title}</h2>
          <p id="confirm-dialog-description">{description}</p>
        </div>
        <button className="confirm-dialog-close" type="button" aria-label="닫기" title="닫기" disabled={busy} onClick={onCancel}><X size={17} /></button>
        <div className="confirm-dialog-actions">
          <button type="button" disabled={busy} onClick={onCancel}>취소</button>
          <button ref={confirmRef} className={danger ? "is-danger" : "is-primary"} type="button" disabled={busy} onClick={onConfirm}>
            {busy && <LoaderCircle className="spin" size={15} />}{confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
