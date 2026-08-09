import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  FileText,
  FolderKanban,
  Lightbulb,
  Plane,
  RefreshCcw,
  Search,
  Users,
} from "lucide-react";
import { MobileMenuButton } from "./Sidebar";
import { pageTemplates } from "../templates";

const templateIcons = {
  blank: FileText,
  meeting: Users,
  project: FolderKanban,
  weekly: RefreshCcw,
  reading: BookOpen,
  tasks: CheckSquare,
  travel: Plane,
  ideas: Lightbulb,
};

function TemplateSketch({ type }) {
  return <div className={`template-sketch sketch-${type}`}><span /><span /><span /><span /><span /></div>;
}

export default function TemplateGallery({ onCreate, onCancel, onOpenSidebar }) {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("blank");
  const [creating, setCreating] = useState(false);
  const visibleTemplates = useMemo(() => pageTemplates.filter((template) => {
    if (category !== "all" && template.category !== category) return false;
    return `${template.title} ${template.description}`.toLocaleLowerCase("ko-KR").includes(query.trim().toLocaleLowerCase("ko-KR"));
  }), [category, query]);
  const selected = pageTemplates.find((template) => template.id === selectedId) ?? pageTemplates[0];

  async function createSelected() {
    setCreating(true);
    try {
      await onCreate(selected);
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="workspace-shell template-shell">
      <header className="workspace-header">
        <div className="workspace-title-row"><MobileMenuButton onClick={onOpenSidebar} /><button className="template-back" type="button" aria-label="편집기로 돌아가기" title="돌아가기" onClick={onCancel}><ArrowLeft size={20} /></button><h1>새 페이지 만들기</h1></div>
      </header>
      <div className="template-layout">
        <section className="template-main" aria-label="템플릿 선택">
          <div className="template-filters">
            <div className="template-tabs" role="group" aria-label="템플릿 분류">{[["all", "전체"], ["personal", "개인"], ["work", "업무"], ["study", "학습"]].map(([value, label]) => <button key={value} className={category === value ? "is-active" : ""} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}>{label}</button>)}</div>
            <label className="template-search"><Search size={17} /><input value={query} placeholder="템플릿 검색" aria-label="템플릿 검색" onChange={(event) => setQuery(event.target.value)} /></label>
          </div>
          <div className="template-grid">
            {visibleTemplates.map((template) => {
              const Icon = templateIcons[template.id];
              return (
                <button key={template.id} className={`template-card ${selectedId === template.id ? "is-active" : ""}`} type="button" onClick={() => setSelectedId(template.id)}>
                  <Icon size={34} strokeWidth={1.55} />
                  <strong>{template.title}</strong>
                  <p>{template.description}</p>
                  <TemplateSketch type={template.id} />
                </button>
              );
            })}
          </div>
        </section>
        <aside className="template-preview" aria-label="템플릿 미리보기">
          <span>미리보기</span>
          <div className="template-preview-page"><FileText size={28} /><h2>{selected.pageTitle}</h2><TemplateSketch type={selected.id} /></div>
          <button className="primary-button" type="button" disabled={creating} onClick={createSelected}>{creating ? "만드는 중" : "이 템플릿으로 만들기"}</button>
          <button className="empty-secondary" type="button" onClick={onCancel}>취소</button>
        </aside>
      </div>
    </main>
  );
}
