import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, LoaderCircle, Save, Type, Upload } from "lucide-react";
import { uploadsApi } from "../api";
import { MobileMenuButton } from "./Sidebar";

const fontOptions = [
  { value: "system", label: "시스템 기본" },
  { value: "serif", label: "명조 계열" },
  { value: "mono", label: "고정폭 계열" },
];

export default function SettingsPage({ settings, onSave, onBack, onOpenSidebar }) {
  const [draft, setDraft] = useState(settings);
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
      setDraft((current) => ({
        ...current,
        fontFamily: asset.url,
        customFonts: [
          ...current.customFonts.filter((font) => font.url !== asset.url),
          { name: asset.name, url: asset.url },
        ],
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="settings-shell">
      <header className="editor-toolbar">
        <div className="toolbar-leading">
          <MobileMenuButton onClick={onOpenSidebar} />
          <button className="icon-button settings-back" type="button" aria-label="편집기로 돌아가기" title="편집기로 돌아가기" onClick={onBack}>
            <ChevronLeft size={19} />
          </button>
          <span className="breadcrumb-current">설정</span>
        </div>
        <button className="save-settings-button" type="button" disabled={saving} onClick={saveSettings}>
          {saving ? <LoaderCircle className="spin" size={15} /> : saved ? <Check size={15} /> : <Save size={15} />}
          {saving ? "저장 중" : saved ? "저장됨" : "설정 저장"}
        </button>
      </header>

      <div className="settings-scroll">
        <div className="settings-content">
          <div className="settings-heading">
            <span className="settings-heading-icon" aria-hidden="true"><Type size={21} /></span>
            <div>
              <h1>편집기 설정</h1>
              <p>페이지의 글꼴과 읽기 폭을 조절합니다.</p>
            </div>
          </div>

          <section className="settings-section" aria-labelledby="font-settings-title">
            <div className="settings-section-title">
              <h2 id="font-settings-title">글꼴</h2>
              <span>TTF, OTF, WOFF, WOFF2</span>
            </div>
            <div className="settings-field">
              <label htmlFor="font-family">사용할 글꼴</label>
              <div className="font-control-row">
                <select id="font-family" value={draft.fontFamily} onChange={(event) => setDraft({ ...draft, fontFamily: event.target.value })}>
                  {fontOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  {draft.customFonts.map((font) => <option key={font.url} value={font.url}>{font.name}</option>)}
                </select>
                <button className="secondary-button" type="button" disabled={uploading} onClick={() => fontInputRef.current?.click()}>
                  {uploading ? <LoaderCircle className="spin" size={15} /> : <Upload size={15} />}
                  {uploading ? "업로드 중" : "폰트 업로드"}
                </button>
                <input
                  ref={fontInputRef}
                  className="sr-only"
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadFont(file);
                    event.target.value = "";
                  }}
                />
              </div>
            </div>

            <div className="settings-field">
              <div className="field-label-row">
                <label htmlFor="font-size">본문 크기</label>
                <output htmlFor="font-size">{draft.fontSize}px</output>
              </div>
              <input
                id="font-size"
                className="font-size-slider"
                type="range"
                min="13"
                max="24"
                step="1"
                value={draft.fontSize}
                onChange={(event) => setDraft({ ...draft, fontSize: Number(event.target.value) })}
              />
            </div>
          </section>

          <section className="settings-section" aria-labelledby="width-settings-title">
            <div className="settings-section-title">
              <h2 id="width-settings-title">페이지 너비</h2>
            </div>
            <div className="segmented-control" role="group" aria-label="페이지 너비">
              {[
                ["compact", "좁게"],
                ["standard", "기본"],
                ["wide", "넓게"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={draft.editorWidth === value ? "is-active" : ""}
                  type="button"
                  aria-pressed={draft.editorWidth === value}
                  onClick={() => setDraft({ ...draft, editorWidth: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="font-preview" aria-label="글꼴 미리보기" style={{ fontSize: `${draft.fontSize}px` }}>
            <span>NoteNest Preview</span>
            <p>생각이 모이는 작은 둥지. 오늘의 아이디어를 편안하게 기록해보세요.</p>
            <code>const idea = "ready";</code>
          </section>

          {error && <div className="settings-error" role="alert">{error}</div>}
        </div>
      </div>
    </main>
  );
}
