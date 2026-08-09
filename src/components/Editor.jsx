import { useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  FileText,
  Folder,
  ImagePlus,
  LoaderCircle,
  Plus,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { uploadsApi } from "../api";
import { normalizeTags, tagTone } from "../utils";
import BlockEditor from "./BlockEditor";
import { MobileMenuButton } from "./Sidebar";

const pageIcons = ["📝", "💡", "✅", "📚", "🎯", "📌", "🧭", "💻", "🌿", "✨"];

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function SaveStatus({ state }) {
  if (state === "saving") {
    return (
      <span className="save-state">
        <LoaderCircle className="spin" aria-hidden="true" size={14} />
        저장 중
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="save-state is-error">
        <AlertCircle aria-hidden="true" size={14} />
        저장 실패
      </span>
    );
  }
  return (
    <span className="save-state">
      <Check aria-hidden="true" size={14} />
      저장됨
    </span>
  );
}

function PageIcon({ value, onChange, onError }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const isImage = value?.startsWith("http://") || value?.startsWith("https://");

  async function uploadIcon(file) {
    setUploading(true);
    try {
      const asset = await uploadsApi.upload(file, "image");
      onChange(asset.url);
      setOpen(false);
    } catch (error) {
      onError(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="page-icon-control">
      <button className="page-icon-button" type="button" aria-label="페이지 아이콘 변경" onClick={() => setOpen((current) => !current)}>
        {isImage ? <img src={value} alt="" /> : value || <FileText size={27} strokeWidth={1.6} />}
      </button>
      {open && (
        <div className="icon-picker" role="dialog" aria-label="페이지 아이콘 선택">
          <div className="emoji-grid">
            {pageIcons.map((icon) => (
              <button key={icon} type="button" aria-label={`${icon} 아이콘`} onClick={() => { onChange(icon); setOpen(false); }}>
                {icon}
              </button>
            ))}
          </div>
          <button className="picker-upload" type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>
            <ImagePlus size={15} />
            {uploading ? "업로드 중" : "이미지 아이콘 업로드"}
          </button>
          {value && (
            <button className="picker-remove" type="button" onClick={() => { onChange(""); setOpen(false); }}>
              아이콘 제거
            </button>
          )}
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadIcon(file);
              event.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function Editor({ page, folders, saveState, settings, onChange, onDelete, onOpenSidebar }) {
  const coverInputRef = useRef(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [assetError, setAssetError] = useState("");
  const [tagInput, setTagInput] = useState("");

  async function uploadCover(file) {
    setCoverUploading(true);
    setAssetError("");
    try {
      const asset = await uploadsApi.upload(file, "image");
      onChange({ coverUrl: asset.url });
    } catch (error) {
      setAssetError(error.message);
    } finally {
      setCoverUploading(false);
    }
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag) return;
    onChange({ tags: normalizeTags([...(page.tags ?? []), tag]) });
    setTagInput("");
  }

  function removeTag(tag) {
    onChange({ tags: (page.tags ?? []).filter((item) => item !== tag) });
  }

  return (
    <main className="editor-shell">
      <header className="editor-toolbar">
        <div className="toolbar-leading">
          <MobileMenuButton onClick={onOpenSidebar} />
          <span className="breadcrumb">NoteNest</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{page.title || "제목 없는 페이지"}</span>
        </div>
        <div className="toolbar-actions">
          <SaveStatus state={saveState} />
          <span className="toolbar-divider" aria-hidden="true" />
          <button
            className={`icon-button ${page.favorite ? "is-favorite" : ""}`}
            type="button"
            aria-label={page.favorite ? "즐겨찾기 해제" : "즐겨찾기에 추가"}
            title={page.favorite ? "즐겨찾기 해제" : "즐겨찾기에 추가"}
            onClick={() => onChange({ favorite: !page.favorite })}
          >
            <Star aria-hidden="true" size={18} fill={page.favorite ? "currentColor" : "none"} />
          </button>
          <button
            className="icon-button danger-button"
            type="button"
            aria-label="페이지 삭제"
            title="페이지 삭제"
            onClick={onDelete}
          >
            <Trash2 aria-hidden="true" size={18} />
          </button>
        </div>
      </header>

      <div className="editor-scroll">
        {page.coverUrl && (
          <div className="page-cover">
            <img src={page.coverUrl} alt="" />
            <div className="cover-actions">
              <button type="button" onClick={() => coverInputRef.current?.click()}>
                <ImagePlus size={15} />
                배너 변경
              </button>
              <button type="button" aria-label="배너 제거" title="배너 제거" onClick={() => onChange({ coverUrl: "" })}>
                <X size={15} />
              </button>
            </div>
          </div>
        )}
        <article className={`editor-content width-${settings.editorWidth} ${page.coverUrl ? "has-cover" : ""}`}>
          <div className="page-property-row">
            <PageIcon value={page.icon} onChange={(icon) => onChange({ icon })} onError={setAssetError} />
            {!page.coverUrl && (
              <button className="subtle-action" type="button" disabled={coverUploading} onClick={() => coverInputRef.current?.click()}>
                <ImagePlus size={15} />
                {coverUploading ? "업로드 중" : "배너 추가"}
              </button>
            )}
          </div>
          {assetError && <div className="asset-error" role="alert">{assetError}</div>}
          <input
            className="title-input"
            value={page.title}
            aria-label="페이지 제목"
            placeholder="제목 없는 페이지"
            onChange={(event) => onChange({ title: event.target.value })}
          />
          <div className="document-properties">
            <span className="document-date"><CalendarDays size={15} /> {formatDate(page.createdAt)}</span>
            <label className="document-folder">
              <Folder size={15} />
              <span className="sr-only">폴더</span>
              <input
                list={`page-folders-${page.id}`}
                value={page.folder ?? ""}
                placeholder="폴더"
                onChange={(event) => onChange({ folder: event.target.value })}
              />
              <datalist id={`page-folders-${page.id}`}>
                {[...new Set([page.folder, ...folders].filter(Boolean))].map((folder) => <option key={folder} value={folder} />)}
              </datalist>
            </label>
            <div className="document-tags" aria-label="페이지 태그">
              {(page.tags ?? []).map((tag) => (
                <span key={tag} className={`tag-chip editable tone-${tagTone(tag)}`}>
                  <Tag size={13} />
                  {tag}
                  <button type="button" aria-label={`${tag} 태그 제거`} onClick={() => removeTag(tag)}><X size={12} /></button>
                </span>
              ))}
              <label className="tag-composer">
                <Plus size={14} />
                <span className="sr-only">태그 추가</span>
                <input
                  value={tagInput}
                  placeholder="태그"
                  onChange={(event) => setTagInput(event.target.value)}
                  onBlur={addTag}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <BlockEditor page={page} onChange={onChange} />
        </article>
      </div>
      <input
        ref={coverInputRef}
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadCover(file);
          event.target.value = "";
        }}
      />
    </main>
  );
}
