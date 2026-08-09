import { FilePlus2, LockKeyhole, NotebookPen } from "lucide-react";
import { MobileMenuButton } from "./Sidebar";

export default function EmptyState({ hasPages, onCreate, onCreateTemplate, onOpenSidebar }) {
  return (
    <main className="empty-shell">
      <div className="empty-toolbar">
        <MobileMenuButton onClick={onOpenSidebar} />
      </div>
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">
          <NotebookPen size={30} strokeWidth={1.6} />
        </span>
        <h1>{hasPages ? "페이지를 선택하세요" : "기록할 준비가 되었습니다"}</h1>
        <p>{hasPages ? "왼쪽 목록에서 이어서 작성할 페이지를 골라주세요." : "새 페이지를 만들거나 템플릿으로 시작하세요."}</p>
        <div className="empty-actions">
          <button className="primary-button" type="button" onClick={() => onCreate()}><FilePlus2 aria-hidden="true" size={17} /> 새 페이지 만들기</button>
          {!hasPages && <button className="empty-secondary" type="button" onClick={onCreateTemplate}><NotebookPen aria-hidden="true" size={17} /> 템플릿으로 시작</button>}
        </div>
        <span className="empty-local-note"><LockKeyhole size={14} /> 로컬에 안전하게 저장됩니다</span>
      </div>
    </main>
  );
}
