import { useEffect, useState } from "react";
import { Check, Clock3, LoaderCircle, RotateCcw, X } from "lucide-react";
import { versionsApi } from "../api";
import { formatDateTime, pageExcerpt } from "../utils";

export default function VersionHistoryPanel({ page, onRestore, onClose }) {
  const [versions, setVersions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState("");

  async function loadVersions() {
    setLoading(true);
    try {
      const data = await versionsApi.list(page.id);
      setVersions(data);
      setSelectedId((current) => data.some((version) => version.id === current) ? current : data[0]?.id ?? null);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVersions();
  }, [page.id]);

  const selected = versions.find((version) => version.id === selectedId) ?? null;

  async function restoreSelected() {
    if (!selected) return;
    setRestoring(true);
    try {
      await onRestore(selected.id);
      await loadVersions();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRestoring(false);
    }
  }

  return (
    <aside className="version-panel" aria-label="버전 기록">
      <div className="version-panel-heading"><h2>버전 기록</h2><button type="button" aria-label="버전 기록 닫기" title="닫기" onClick={onClose}><X size={18} /></button></div>
      {loading ? <div className="version-loading"><LoaderCircle className="spin" size={18} /> 불러오는 중</div> : versions.length === 0 ? (
        <div className="version-empty"><Clock3 size={26} /><strong>아직 이전 버전이 없습니다</strong><p>내용을 수정하면 자동 저장 전 상태가 여기에 남습니다.</p></div>
      ) : (
        <>
          <div className="version-list">
            {versions.map((version) => (
              <button key={version.id} className={selectedId === version.id ? "is-active" : ""} type="button" onClick={() => setSelectedId(version.id)}>
                <span><Clock3 size={15} />{formatDateTime(version.savedAt)}</span>
                <small>자동 저장</small>
                {selectedId === version.id && <Check size={16} />}
              </button>
            ))}
          </div>
          {selected && <div className="version-preview"><strong>{selected.title}</strong><p>{pageExcerpt(selected, 240)}</p></div>}
          <button className="version-restore" type="button" disabled={restoring} onClick={restoreSelected}>{restoring ? <LoaderCircle className="spin" size={16} /> : <RotateCcw size={16} />} 이 버전 복원</button>
        </>
      )}
      {error && <div className="version-error" role="alert">{error}</div>}
    </aside>
  );
}
