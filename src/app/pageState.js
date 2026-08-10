export const defaultSettings = {
  fontFamily: "system",
  fontSize: 16,
  editorWidth: "standard",
  theme: "system",
  lineSpacing: "comfortable",
  reduceMotion: false,
  customFonts: [],
  tagColors: {},
};

const pendingDraftKey = "notenest:pending-draft:v1";

export function readPendingDraft() {
  try {
    const pending = JSON.parse(window.localStorage.getItem(pendingDraftKey));
    return pending?.page?.id ? pending : null;
  } catch {
    return null;
  }
}

export function rememberPendingDraft(page, baseSignature) {
  try {
    window.localStorage.setItem(pendingDraftKey, JSON.stringify({
      page,
      baseSignature,
      cachedAt: new Date().toISOString(),
    }));
  } catch {
    // Browser caching is a fallback and must not interrupt the primary save path.
  }
}

export function clearPendingDraft(pageId) {
  try {
    const pending = readPendingDraft();
    if (!pending || !pageId || pending.page.id === pageId) {
      window.localStorage.removeItem(pendingDraftKey);
    }
  } catch {
    // Local storage can be unavailable in hardened browser contexts.
  }
}

export function pageSignature(page) {
  return JSON.stringify({
    title: page.title,
    content: page.content,
    blocks: page.blocks,
    icon: page.icon,
    coverUrl: page.coverUrl,
    folderId: page.folderId,
    folder: page.folder,
    tags: page.tags,
    favorite: page.favorite,
  });
}

export function pageChanges(page) {
  return {
    title: page.title,
    content: page.content,
    blocks: page.blocks,
    icon: page.icon,
    coverUrl: page.coverUrl,
    folderId: page.folderId,
    folder: page.folder,
    tags: page.tags,
    favorite: page.favorite,
  };
}

export function sortByUpdatedAt(pages) {
  return [...pages].sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));
}

export function setPageLocation(pageId) {
  const url = new URL(window.location.href);
  if (pageId) url.searchParams.set("page", pageId);
  else url.searchParams.delete("page");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}
