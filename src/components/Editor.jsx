import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CloudOff,
  Copy,
  ExternalLink,
  FileText,
  Folder,
  History,
  ImagePlus,
  Link2,
  LoaderCircle,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  Share2,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { uploadsApi } from "../api";
import { normalizeTags, tagTone } from "../utils";
import BlockEditor from "./BlockEditor";
import PageGlyph from "./PageGlyph";
import { MobileMenuButton } from "./Sidebar";
import VersionHistoryPanel from "./VersionHistoryPanel";

const pageIcons = ["📝", "💡", "✅", "📚", "🎯", "📌", "🧭", "💻", "🌿", "✨"];

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatLastEdited(value) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "방금 편집";
  if (minutes < 60) return `${minutes}분 전 편집`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전 편집`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전 편집`;
  return `${formatDate(value)} 편집`;
}

function SaveStatus({ state }) {
  if (state === "saving") {
    return (
      <span className="save-state is-saving" role="status" aria-live="polite">
        <LoaderCircle className="spin" aria-hidden="true" size={14} />
        <span>저장 중</span>
      </span>
    );
  }
  if (state === "offline") {
    return (
      <span className="save-state is-offline" role="status" aria-live="polite">
        <CloudOff aria-hidden="true" size={14} />
        <span>기기에 임시 저장</span>
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="save-state is-error" role="status" aria-live="polite">
        <AlertCircle aria-hidden="true" size={14} />
        <span>저장 실패</span>
      </span>
    );
  }
  return (
    <span className="save-state is-saved" role="status" aria-live="polite">
      <Check aria-hidden="true" size={14} />
      <span>저장됨</span>
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

export default function Editor({ page, folders, saveState, settings, onChange, onCopyLink, onCreate, onDelete, onDuplicate, onOpenNewTab, onRestoreVersion, onOpenSidebar }) {
  const coverInputRef = useRef(null);
  const topbarActionsRef = useRef(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [assetError, setAssetError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeTopbarMenu, setActiveTopbarMenu] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setHistoryOpen(false);
    setActiveTopbarMenu("");
    setLinkCopied(false);
  }, [page.id]);

  useEffect(() => {
    if (!activeTopbarMenu) return undefined;
    function closeMenu(event) {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "pointerdown" && topbarActionsRef.current?.contains(event.target)) return;
      setActiveTopbarMenu("");
    }
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, [activeTopbarMenu]);

  async function copyPageLink() {
    try {
      await onCopyLink(page);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1800);
    } catch (error) {
      setAssetError(error.message);
    }
  }

  async function runTopbarAction(action) {
    setActiveTopbarMenu("");
    try {
      await action();
    } catch (error) {
      setAssetError(error.message);
    }
  }

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
      <header className="editor-toolbar notion-toolbar">
        <div className="editor-window-row">
          <div className="editor-page-tab" aria-current="page">
            <PageGlyph page={page} size={14} />
            <span>{page.title || "제목 없는 페이지"}</span>
          </div>
          <button className="editor-new-tab" type="button" aria-label="새 페이지" title="새 페이지" onClick={() => onCreate()}>
            <Plus aria-hidden="true" size={16} />
          </button>
        </div>
        <div className="editor-page-row">
          <div className="toolbar-leading">
            <MobileMenuButton onClick={onOpenSidebar} />
            <PageGlyph page={page} size={16} />
            <span className="breadcrumb-current">{page.title || "제목 없는 페이지"}</span>
            <span className="page-visibility">
              {page.folder && page.folder !== "미분류" ? <Folder aria-hidden="true" size={13} /> : <LockKeyhole aria-hidden="true" size={13} />}
              {page.folder && page.folder !== "미분류" ? page.folder : "개인 페이지"}
            </span>
          </div>
          <div className="toolbar-actions" ref={topbarActionsRef}>
            <span className="last-edited">{formatLastEdited(page.updatedAt)}</span>
            <SaveStatus state={saveState} />
            <div className="topbar-popover-wrap">
              <button className={`topbar-share-button ${activeTopbarMenu === "share" ? "is-active" : ""}`} type="button" aria-expanded={activeTopbarMenu === "share"} onClick={() => setActiveTopbarMenu((current) => current === "share" ? "" : "share")}>
                <Share2 aria-hidden="true" size={15} />
                <span>공유</span>
              </button>
              {activeTopbarMenu === "share" && (
                <div className="topbar-popover share-popover" role="dialog" aria-label="페이지 공유">
                  <div className="topbar-popover-heading"><strong>이 페이지 공유</strong><small>링크로 바로 열 수 있습니다</small></div>
                  <div className="share-scope"><span><LockKeyhole size={15} /></span><div><strong>내 NoteNest</strong><small>로컬 워크스페이스</small></div></div>
                  <button className="copy-link-button" type="button" onClick={copyPageLink}>
                    {linkCopied ? <Check aria-hidden="true" size={15} /> : <Link2 aria-hidden="true" size={15} />}
                    {linkCopied ? "링크를 복사했습니다" : "페이지 링크 복사"}
                  </button>
                </div>
              )}
            </div>
            <button
              className={`icon-button ${page.favorite ? "is-favorite" : ""}`}
              type="button"
              aria-label={page.favorite ? "즐겨찾기 해제" : "즐겨찾기에 추가"}
              title={page.favorite ? "즐겨찾기 해제" : "즐겨찾기에 추가"}
              onClick={() => onChange({ favorite: !page.favorite })}
            >
              <Star aria-hidden="true" size={17} fill={page.favorite ? "currentColor" : "none"} />
            </button>
            <div className="topbar-popover-wrap">
              <button className={`icon-button ${activeTopbarMenu === "more" ? "is-active" : ""}`} type="button" aria-label="페이지 메뉴" title="페이지 메뉴" aria-expanded={activeTopbarMenu === "more"} onClick={() => setActiveTopbarMenu((current) => current === "more" ? "" : "more")}>
                <MoreHorizontal aria-hidden="true" size={18} />
              </button>
              {activeTopbarMenu === "more" && (
                <div className="topbar-popover page-actions-popover" role="menu">
                  <button type="button" role="menuitem" onClick={() => { setActiveTopbarMenu(""); setHistoryOpen(true); }}><History size={15} />버전 기록</button>
                  <button type="button" role="menuitem" onClick={() => runTopbarAction(() => onDuplicate(page))}><Copy size={15} />사본 만들기</button>
                  <button type="button" role="menuitem" onClick={() => runTopbarAction(() => onOpenNewTab(page))}><ExternalLink size={15} />새 창에서 열기</button>
                  <span className="topbar-menu-separator" aria-hidden="true" />
                  <button className="is-danger" type="button" role="menuitem" onClick={() => runTopbarAction(onDelete)}><Trash2 size={15} />휴지통으로 이동</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={`editor-workspace ${historyOpen ? "has-version-panel" : ""}`}>
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
              <select
                value={page.folderId ?? ""}
                onChange={(event) => {
                  const folder = folders.find((item) => item.id === event.target.value);
                  onChange({ folderId: event.target.value, folder: folder?.name ?? "미분류" });
                }}
              >
                <option value="">미분류</option>
                {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
              </select>
            </label>
            <div className="document-tags" aria-label="페이지 태그">
              {(page.tags ?? []).map((tag) => (
                <span key={tag} className={`tag-chip editable tone-${tagTone(tag, settings.tagColors)}`}>
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
      {historyOpen && <VersionHistoryPanel page={page} onRestore={onRestoreVersion} onClose={() => setHistoryOpen(false)} />}
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
