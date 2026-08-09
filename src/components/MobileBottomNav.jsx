import { FileText, Search, Settings } from "lucide-react";

export default function MobileBottomNav({ view, onNavigate, onOpenSettings }) {
  const items = [
    { id: "notes", label: "노트", icon: FileText, active: !["search", "settings"].includes(view), action: () => onNavigate("all") },
    { id: "search", label: "검색", icon: Search, active: view === "search", action: () => onNavigate("search") },
    { id: "settings", label: "설정", icon: Settings, active: view === "settings", action: onOpenSettings },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="모바일 주요 메뉴">
      {items.map(({ id, label, icon: Icon, active, action }) => (
        <button key={id} className={active ? "is-active" : ""} type="button" aria-current={active ? "page" : undefined} onClick={action}>
          <Icon size={21} strokeWidth={1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
