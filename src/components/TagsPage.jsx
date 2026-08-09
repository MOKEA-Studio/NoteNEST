import { useEffect, useMemo, useState } from "react";
import { Check, MoreVertical, Palette, Pencil, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { MobileMenuButton } from "./Sidebar";
import PageGlyph from "./PageGlyph";
import { formatShortDate, pageExcerpt, pageTitle, tagTone, tagTones } from "../utils";

const toneNames = {
  green: "초록",
  gold: "노랑",
  coral: "코랄",
  cyan: "청록",
  olive: "올리브",
  indigo: "남색",
};

function TagColorPicker({ value, label, disabled = false, onChange }) {
  return (
    <div className="tag-color-picker" role="group" aria-label={label}>
      {tagTones.map((tone) => (
        <button
          key={tone}
          className={`tag-color-option tone-${tone} ${value === tone ? "is-selected" : ""}`}
          type="button"
          aria-label={`${label}: ${toneNames[tone]}`}
          aria-pressed={value === tone}
          title={toneNames[tone]}
          disabled={disabled}
          onClick={() => onChange(tone)}
        >
          <span className="tag-color-dot" aria-hidden="true" />
          {value === tone && <Check size={11} strokeWidth={3} aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}

export default function TagsPage({
  pages,
  selectedId,
  selectedTag,
  onSelectTag,
  onSelect,
  onAddTag,
  onRenameTag,
  onDeleteTag,
  onSetTagColor,
  tagColors = {},
  onOpenSidebar,
}) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newTone, setNewTone] = useState(tagTones[0]);
  const [targetPageId, setTargetPageId] = useState(selectedId || pages[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [renamingTag, setRenamingTag] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [colorSaving, setColorSaving] = useState(false);

  const tags = useMemo(() => {
    const counts = new Map();
    for (const page of pages) {
      for (const tag of page.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right, "ko-KR"));
  }, [pages]);
  const visibleTags = tags.filter(([tag]) => tag.toLocaleLowerCase("ko-KR").includes(query.trim().toLocaleLowerCase("ko-KR")));

  useEffect(() => {
    if (selectedTag && tags.some(([tag]) => tag === selectedTag)) return;
    onSelectTag(tags[0]?.[0] ?? "");
  }, [onSelectTag, selectedTag, tags]);

  useEffect(() => {
    if (!targetPageId && pages[0]) setTargetPageId(pages[0].id);
  }, [pages, targetPageId]);

  const taggedPages = pages.filter((page) => page.tags?.includes(selectedTag));

  async function submitTag(event) {
    event.preventDefault();
    const name = newTag.trim();
    if (!name || !targetPageId) return;
    setSaving(true);
    try {
      await onAddTag(name, targetPageId, newTone);
      onSelectTag(name);
      setNewTag("");
      setNewTone(tagTones[0]);
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  function beginRename(tag) {
    onSelectTag(tag);
    setRenamingTag(tag);
    setRenameValue(tag);
  }

  async function submitRename(event) {
    event.preventDefault();
    const nextName = renameValue.trim();
    if (!renamingTag || !nextName) return;
    if (nextName === renamingTag) {
      setRenamingTag("");
      return;
    }
    setRenameSaving(true);
    try {
      await onRenameTag(renamingTag, nextName);
      onSelectTag(nextName);
      setRenamingTag("");
    } finally {
      setRenameSaving(false);
    }
  }

  async function changeSelectedColor(tone) {
    if (!selectedTag || tone === tagTone(selectedTag, tagColors)) return;
    setColorSaving(true);
    try {
      await onSetTagColor(selectedTag, tone);
    } catch {
      // The workspace-level error banner reports the failed settings request.
    } finally {
      setColorSaving(false);
    }
  }

  return (
    <main className="workspace-shell tag-shell">
      <header className="workspace-header">
        <div className="workspace-title-row"><MobileMenuButton onClick={onOpenSidebar} /><h1>태그</h1></div>
        <div className="tag-header-actions">
          <label className="tag-search"><Search size={17} /><input value={query} placeholder="태그 검색" aria-label="태그 검색" onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" aria-label="검색어 지우기" onClick={() => setQuery("")}><X size={14} /></button>}</label>
          <button className="primary-button compact-primary" type="button" onClick={() => setAdding(true)}><Plus size={17} /> 새 태그</button>
        </div>
      </header>

      <div className="tags-layout">
        <section className="tag-index" aria-label="태그 목록">
          <div className="tag-index-head"><span>이름</span><span>노트 수</span></div>
          <div className="tag-index-list">
            {visibleTags.map(([tag, count]) => (
              <div key={tag} className={`tag-index-row ${selectedTag === tag ? "is-active" : ""}`}>
                <button type="button" onClick={() => onSelectTag(tag)}><span className={`tag-swatch tone-${tagTone(tag, tagColors)}`} /><span>{tag}</span><small>{count}</small></button>
                <button type="button" aria-label={`${tag} 이름 변경`} title="태그 이름 변경" onClick={() => beginRename(tag)}><MoreVertical size={16} /></button>
              </div>
            ))}
          </div>
          {adding && (
            <form className="new-tag-form" onSubmit={submitTag}>
              <label><span className="sr-only">새 태그 이름</span><input autoFocus value={newTag} placeholder="태그 이름" onChange={(event) => setNewTag(event.target.value)} /></label>
              <label><span className="sr-only">태그를 추가할 페이지</span><select value={targetPageId} onChange={(event) => setTargetPageId(event.target.value)}>{pages.map((page) => <option key={page.id} value={page.id}>{pageTitle(page)}</option>)}</select></label>
              <fieldset className="new-tag-color-field"><legend>색상</legend><TagColorPicker value={newTone} label="새 태그 색상" disabled={saving} onChange={setNewTone} /></fieldset>
              <div className="new-tag-actions"><button className="primary-button" type="submit" disabled={saving || !pages.length}>{saving ? "저장 중" : "저장"}</button><button className="plain-button" type="button" onClick={() => setAdding(false)}>취소</button></div>
            </form>
          )}
          {!visibleTags.length && !adding && <div className="tag-index-empty">표시할 태그가 없습니다.</div>}
        </section>

        <section key={selectedTag || "empty"} className="tag-detail" aria-label={selectedTag ? `${selectedTag} 태그 노트` : "태그 노트"}>
          {selectedTag ? (
            <>
              <div className="tag-detail-heading">
                <div><span className={`tag-swatch large tone-${tagTone(selectedTag, tagColors)}`} /><div>{renamingTag === selectedTag ? (
                  <form className="tag-rename-form" onSubmit={submitRename}>
                    <label><span className="sr-only">태그 이름 변경</span><input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} /></label>
                    <button type="submit" disabled={renameSaving}>{renameSaving ? "저장 중" : "저장"}</button>
                    <button type="button" onClick={() => setRenamingTag("")}>취소</button>
                  </form>
                ) : <h2>{selectedTag}</h2>}<p>이 태그가 포함된 노트 {taggedPages.length}개</p></div></div>
                <div className="tag-detail-actions"><button type="button" aria-label="태그 이름 변경" title="태그 이름 변경" onClick={() => beginRename(selectedTag)}><Pencil size={17} /></button><button className="danger-icon" type="button" aria-label="태그 삭제" title="태그 삭제" onClick={() => onDeleteTag(selectedTag)}><Trash2 size={17} /></button></div>
              </div>
              <div className="tag-color-bar">
                <div className="tag-color-label"><Palette size={16} aria-hidden="true" /><span>태그 색상</span>{colorSaving && <small role="status">저장 중</small>}</div>
                <TagColorPicker value={tagTone(selectedTag, tagColors)} label={`${selectedTag} 태그 색상`} disabled={colorSaving} onChange={changeSelectedColor} />
              </div>
              <div className="tagged-notes">
                {taggedPages.map((page) => (
                  <button key={page.id} className="tagged-note" type="button" onClick={() => onSelect(page)}>
                    <PageGlyph page={page} size={21} />
                    <span><strong>{pageTitle(page)}</strong><small>{page.folder || "미분류"}</small><p>{pageExcerpt(page, 170)}</p></span>
                    <time dateTime={page.updatedAt}>{formatShortDate(page.updatedAt)}</time>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="collection-empty"><Tag size={31} /><h2>아직 태그가 없습니다</h2><button className="primary-button" type="button" onClick={() => setAdding(true)}><Plus size={16} /> 새 태그</button></div>
          )}
        </section>
      </div>
    </main>
  );
}
