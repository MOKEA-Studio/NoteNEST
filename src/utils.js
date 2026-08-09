export function pageTitle(page) {
  return page?.title?.trim() || "제목 없는 페이지";
}

export function pageExcerpt(page, maxLength = 150) {
  const text = page?.content?.replace(/\s+/g, " ").trim() || "아직 작성된 내용이 없습니다.";
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

export function formatShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRelativeDate(value) {
  const date = new Date(value);
  const elapsed = Date.now() - date.getTime();
  if (Number.isNaN(elapsed)) return "";
  const minutes = Math.max(0, Math.floor(elapsed / 60_000));
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  return formatShortDate(value);
}

export function normalizeTags(tags) {
  const result = [];
  const seen = new Set();
  for (const value of tags ?? []) {
    const tag = String(value).trim();
    const key = tag.toLocaleLowerCase("ko-KR");
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
  }
  return result;
}

const tagTones = ["green", "gold", "coral", "cyan", "olive", "indigo"];

export function tagTone(tag) {
  let hash = 0;
  for (const character of tag ?? "") {
    hash = ((hash << 5) - hash + character.codePointAt(0)) | 0;
  }
  return tagTones[Math.abs(hash) % tagTones.length];
}
