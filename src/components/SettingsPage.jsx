import { useEffect, useRef, useState } from "react";
import {
  Archive,
  Check,
  ChevronLeft,
  Database,
  Download,
  FileJson,
  FileText,
  HardDrive,
  LoaderCircle,
  Monitor,
  Moon,
  Save,
  Sun,
  Type,
  Upload,
} from "lucide-react";
import { storageApi, uploadsApi } from "../api";
import { formatDateTime, pageTitle } from "../utils";
import { MobileMenuButton } from "./Sidebar";

const fontOptions = [
  { value: "system", label: "시스템 기본" },
  { value: "serif", label: "명조 계열" },
  { value: "mono", label: "고정폭 계열" },
];

function formatBytes(value) {
  if (!value) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const unit = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / (1024 ** unit)).toFixed(unit > 1 ? 1 : 0)} ${units[unit]}`;
}

function downloadFile(name, type, content) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function markdownForPages(pages) {
  return pages.map((page) => [
    `# ${pageTitle(page)}`,
    "",
    `> 폴더: ${page.folder || "미분류"}`,
    page.tags?.length ? `> 태그: ${page.tags.join(", ")}` : "",
    "",
    page.content || "",
  ].filter(Boolean).join("\n")).join("\n\n---\n\n");
}

function textDocument(text) {
  return {
    type: "doc",
    content: text.split(/\n/).map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : undefined,
    })),
  };
}

function AppearanceSettings({ draft, setDraft, uploading, onUploadFont }) {
  return (
    <>
      <section className="settings-section theme-settings" aria-labelledby="theme-settings-title">
        <div className="settings-section-title"><h2 id="theme-settings-title">테마</h2></div>
        <div className="theme-options" role="group" aria-label="테마 선택">
          {[
            ["light", "라이트", Sun],
            ["system", "시스템", Monitor],
            ["dark", "다크", Moon],
          ].map(([value, label, Icon]) => (
            <button key={value} className={draft.theme === value ? "is-active" : ""} type="button" aria-pressed={draft.theme === value} onClick={() => setDraft({ ...draft, theme: value })}>
              <span className={`theme-preview theme-${value}`}><Icon size={19} /></span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section" aria-labelledby="font-settings-title">
        <div className="settings-section-title"><h2 id="font-settings-title">편집기 글꼴</h2><span>TTF, OTF, WOFF, WOFF2</span></div>
        <div className="settings-field">
          <label htmlFor="font-family">사용할 글꼴</label>
          <div className="font-control-row">
            <select id="font-family" value={draft.fontFamily} onChange={(event) => setDraft({ ...draft, fontFamily: event.target.value })}>
              {fontOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              {draft.customFonts.map((font) => <option key={font.url} value={font.url}>{font.name}</option>)}
            </select>
            <button className="secondary-button" type="button" disabled={uploading} onClick={onUploadFont}>{uploading ? <LoaderCircle className="spin" size={15} /> : <Upload size={15} />}{uploading ? "업로드 중" : "폰트 업로드"}</button>
          </div>
        </div>
        <div className="settings-field">
          <div className="field-label-row"><label htmlFor="font-size">본문 크기</label><output htmlFor="font-size">{draft.fontSize}px</output></div>
          <input id="font-size" className="font-size-slider" type="range" min="13" max="24" step="1" value={draft.fontSize} onChange={(event) => setDraft({ ...draft, fontSize: Number(event.target.value) })} />
        </div>
      </section>

      <section className="settings-section" aria-labelledby="layout-settings-title">
        <div className="settings-section-title"><h2 id="layout-settings-title">읽기 환경</h2></div>
        <div className="settings-field"><label>페이지 너비</label><div className="segmented-control" role="group" aria-label="페이지 너비">{[["compact", "좁게"], ["standard", "기본"], ["wide", "넓게"]].map(([value, label]) => <button key={value} className={draft.editorWidth === value ? "is-active" : ""} type="button" aria-pressed={draft.editorWidth === value} onClick={() => setDraft({ ...draft, editorWidth: value })}>{label}</button>)}</div></div>
        <div className="settings-field"><label>줄 간격</label><div className="segmented-control" role="group" aria-label="줄 간격">{[["compact", "촘촘하게"], ["comfortable", "편안하게"], ["relaxed", "넉넉하게"]].map(([value, label]) => <button key={value} className={draft.lineSpacing === value ? "is-active" : ""} type="button" aria-pressed={draft.lineSpacing === value} onClick={() => setDraft({ ...draft, lineSpacing: value })}>{label}</button>)}</div></div>
        <label className="toggle-setting"><span><strong>애니메이션 줄이기</strong><small>화면 전환과 인터페이스 움직임을 최소화합니다.</small></span><input type="checkbox" role="switch" checked={draft.reduceMotion} onChange={(event) => setDraft({ ...draft, reduceMotion: event.target.checked })} /></label>
      </section>

      <section className="font-preview" aria-label="글꼴 미리보기" style={{ fontSize: `${draft.fontSize}px` }}>
        <span>생각을 편안하게 기록하세요</span><p>NoteNest는 아이디어와 기록을 로컬에 안전하게 보관합니다.</p><code>const idea = "ready";</code>
      </section>
    </>
  );
}

function StorageSettings() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [error, setError] = useState("");

  async function loadStorage() {
    setLoading(true);
    try {
      setInfo(await storageApi.get());
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStorage();
  }, []);

  async function backupNow() {
    setBackingUp(true);
    try {
      await storageApi.backup();
      await loadStorage();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBackingUp(false);
    }
  }

  if (loading) return <div className="settings-loading"><LoaderCircle className="spin" size={20} /> 저장소 정보를 불러오는 중...</div>;
  const total = info?.totalBytes || 1;

  return (
    <>
      <section className="settings-section storage-section" aria-labelledby="local-storage-title">
        <div className="settings-section-title"><h2 id="local-storage-title">로컬 데이터</h2></div>
        <div className="storage-path"><span>데이터베이스 위치</span><code>{info?.databasePath}</code></div>
        <div className="storage-usage"><div className="storage-total"><span>저장 공간</span><strong>{formatBytes(info?.totalBytes)}</strong></div><div className="storage-bar"><span style={{ width: `${(info?.notesBytes / total) * 100}%` }} /><span style={{ width: `${(info?.uploadsBytes / total) * 100}%` }} /><span style={{ width: `${(info?.backupsBytes / total) * 100}%` }} /></div><div className="storage-legend"><span><i className="notes" />노트 {formatBytes(info?.notesBytes)}</span><span><i className="uploads" />업로드 {formatBytes(info?.uploadsBytes)}</span><span><i className="backups" />백업 {formatBytes(info?.backupsBytes)}</span></div></div>
      </section>
      <section className="settings-section backup-section" aria-labelledby="backup-title">
        <div className="settings-section-title"><h2 id="backup-title">백업</h2><span>현재 데이터의 일관된 SQLite 사본</span></div>
        <div className="backup-action"><div><strong>수동 백업</strong><p>노트와 설정을 로컬 백업 폴더에 저장합니다.</p></div><button className="primary-button" type="button" disabled={backingUp} onClick={backupNow}>{backingUp ? <LoaderCircle className="spin" size={16} /> : <Archive size={16} />}{backingUp ? "백업 중" : "지금 백업"}</button></div>
        <div className="backup-list"><div className="backup-list-head"><span>날짜</span><span>크기</span><span>상태</span></div>{info?.backups?.length ? info.backups.map((backup) => <div key={backup.name} className="backup-row"><span>{formatDateTime(backup.createdAt)}</span><span>{formatBytes(backup.size)}</span><span><Check size={14} /> 완료</span></div>) : <div className="backup-empty">아직 생성된 백업이 없습니다.</div>}</div>
      </section>
      {error && <div className="settings-error" role="alert">{error}</div>}
    </>
  );
}

function TransferSettings({ pages, currentPage, onImport }) {
  const [scope, setScope] = useState("current");
  const [format, setFormat] = useState("markdown");
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState("");
  const importRef = useRef(null);
  const targets = scope === "all" ? pages : currentPage ? [currentPage] : [];

  function exportPages() {
    if (!targets.length) return;
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "json") downloadFile(`notenest-${stamp}.json`, "application/json", JSON.stringify(targets, null, 2));
    else downloadFile(`notenest-${stamp}.md`, "text/markdown;charset=utf-8", markdownForPages(targets));
    setStatus(`${targets.length}개 페이지 내보내기 완료`);
  }

  async function importFile(file) {
    setImporting(true);
    setStatus("");
    try {
      const text = await file.text();
      let entries;
      if (file.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(text);
        entries = (Array.isArray(parsed) ? parsed : [parsed]).map((page) => ({
          title: page.title || "가져온 페이지",
          content: page.content || "",
          blocks: page.blocks?.type === "doc" ? page.blocks : textDocument(page.content || ""),
          folder: page.folder || "가져온 노트",
          tags: Array.isArray(page.tags) ? page.tags : ["가져오기"],
          icon: page.icon || "",
          coverUrl: page.coverUrl || "",
          favorite: Boolean(page.favorite),
        }));
      } else {
        entries = [{ title: file.name.replace(/\.md$/i, "") || "가져온 페이지", content: text, blocks: textDocument(text), folder: "가져온 노트", tags: ["가져오기"] }];
      }
      await onImport(entries);
      setStatus(`${entries.length}개 페이지 가져오기 완료`);
    } catch (requestError) {
      setStatus(requestError.message || "파일을 가져오지 못했습니다.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <section className="settings-section transfer-section" aria-labelledby="export-title">
        <div className="settings-section-title"><h2 id="export-title">내보내기</h2><span>Markdown 또는 전체 데이터 JSON</span></div>
        <div className="settings-field"><label>내보낼 범위</label><div className="choice-list"><label><input type="radio" name="export-scope" value="current" checked={scope === "current"} onChange={() => setScope("current")} />현재 페이지</label><label><input type="radio" name="export-scope" value="all" checked={scope === "all"} onChange={() => setScope("all")} />모든 노트</label></div></div>
        <div className="settings-field"><label>파일 형식</label><div className="format-options" role="group" aria-label="내보내기 형식"><button className={format === "markdown" ? "is-active" : ""} type="button" aria-pressed={format === "markdown"} onClick={() => setFormat("markdown")}><FileText size={22} />Markdown</button><button className={format === "json" ? "is-active" : ""} type="button" aria-pressed={format === "json"} onClick={() => setFormat("json")}><FileJson size={22} />JSON 백업</button></div></div>
        <button className="transfer-primary" type="button" disabled={!targets.length} onClick={exportPages}><Download size={17} />{targets.length}개 페이지 내보내기</button>
      </section>
      <section className="settings-section transfer-section" aria-labelledby="import-title">
        <div className="settings-section-title"><h2 id="import-title">가져오기</h2><span>Markdown, NoteNest JSON</span></div>
        <div className="import-dropzone"><Upload size={24} /><strong>파일에서 페이지 가져오기</strong><p>기존 노트는 유지되고 새 페이지로 추가됩니다.</p><button className="secondary-button" type="button" disabled={importing} onClick={() => importRef.current?.click()}>{importing ? <LoaderCircle className="spin" size={15} /> : <Upload size={15} />}{importing ? "가져오는 중" : "파일 선택"}</button><input ref={importRef} className="sr-only" type="file" accept=".md,.markdown,.json,text/markdown,application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) importFile(file); event.target.value = ""; }} /></div>
      </section>
      {status && <div className="transfer-status" role="status"><Check size={16} />{status}</div>}
    </>
  );
}

export default function SettingsPage({ settings, pages, currentPage, onSave, onImport, onBack, onOpenSidebar }) {
  const [draft, setDraft] = useState(settings);
  const [section, setSection] = useState("appearance");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fontInputRef = useRef(null);

  useEffect(() => setDraft(settings), [settings]);

  async function saveSettings() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await onSave(draft);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadFont(file) {
    setUploading(true);
    setError("");
    try {
      const asset = await uploadsApi.upload(file, "font");
      setDraft((current) => ({ ...current, fontFamily: asset.url, customFonts: [...current.customFonts.filter((font) => font.url !== asset.url), { name: asset.name, url: asset.url }] }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  }

  const sectionTitle = section === "appearance" ? "편집기 및 모양" : section === "storage" ? "데이터 및 저장소" : "가져오기 및 내보내기";

  return (
    <main className="settings-shell expanded-settings">
      <header className="editor-toolbar">
        <div className="toolbar-leading"><MobileMenuButton onClick={onOpenSidebar} /><button className="icon-button settings-back" type="button" aria-label="편집기로 돌아가기" title="편집기로 돌아가기" onClick={onBack}><ChevronLeft size={19} /></button><span className="breadcrumb-current">설정 / {sectionTitle}</span></div>
        {section === "appearance" && <button className="save-settings-button" type="button" disabled={saving} onClick={saveSettings}>{saving ? <LoaderCircle className="spin" size={15} /> : saved ? <Check size={15} /> : <Save size={15} />}{saving ? "저장 중" : saved ? "저장됨" : "설정 저장"}</button>}
      </header>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="설정 메뉴"><h1>설정</h1>{[["appearance", "편집기 및 모양", Type], ["storage", "데이터 및 저장소", Database], ["transfer", "가져오기 및 내보내기", Download]].map(([value, label, Icon]) => <button key={value} className={section === value ? "is-active" : ""} type="button" aria-current={section === value ? "page" : undefined} onClick={() => setSection(value)}><Icon size={17} />{label}</button>)}</nav>
        <div className="settings-scroll"><div className="settings-content expanded-content"><div className="settings-heading"><span className="settings-heading-icon" aria-hidden="true">{section === "appearance" ? <Type size={21} /> : section === "storage" ? <HardDrive size={21} /> : <Download size={21} />}</span><div><h1>{sectionTitle}</h1><p>{section === "appearance" ? "읽고 쓰는 환경을 나에게 맞게 조절합니다." : section === "storage" ? "로컬 데이터 사용량을 확인하고 백업합니다." : "노트를 파일로 옮기거나 다시 가져옵니다."}</p></div></div>{section === "appearance" ? <AppearanceSettings draft={draft} setDraft={setDraft} uploading={uploading} onUploadFont={() => fontInputRef.current?.click()} /> : section === "storage" ? <StorageSettings /> : <TransferSettings pages={pages} currentPage={currentPage} onImport={onImport} />}{error && <div className="settings-error" role="alert">{error}</div>}</div></div>
      </div>
      <input ref={fontInputRef} className="sr-only" type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadFont(file); event.target.value = ""; }} />
    </main>
  );
}
