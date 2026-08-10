import { useState } from "react";
import { foldersApi, pagesApi, tagsApi } from "../api";
import { normalizeTags, tagTone } from "../utils";

export default function useTaxonomyActions({
  activeFolderId,
  setActiveFolderId,
  setError,
  setSelectedTag,
  setView,
  taxonomy,
  workspace,
}) {
  const [folderDeleteCandidate, setFolderDeleteCandidate] = useState(null);
  const [deletingFolder, setDeletingFolder] = useState(false);

  async function createFolder(name) {
    try {
      const created = await foldersApi.create(name);
      taxonomy.setFolderEntities((current) => [...current, created].sort((left, right) => left.name.localeCompare(right.name, "ko-KR")));
      setError("");
      return created;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function renameFolder(folder, name) {
    try {
      const updated = await foldersApi.update(folder.id, name);
      taxonomy.setFolderEntities((current) => current.map((item) => item.id === updated.id ? updated : item));
      workspace.replaceFolderName(updated.id, updated.name);
      setError("");
      return updated;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  function requestDeleteFolder(folder) {
    setFolderDeleteCandidate(folder);
  }

  async function confirmDeleteFolder() {
    if (!folderDeleteCandidate) return;
    if (!(await workspace.flushDraft())) return;
    setDeletingFolder(true);
    try {
      await foldersApi.remove(folderDeleteCandidate.id);
      taxonomy.setFolderEntities((current) => current.filter((folder) => folder.id !== folderDeleteCandidate.id));
      workspace.detachFolder(folderDeleteCandidate.id);
      if (activeFolderId === folderDeleteCandidate.id) {
        setActiveFolderId("");
        setView("all");
      }
      setFolderDeleteCandidate(null);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingFolder(false);
    }
  }

  async function refreshPagesAndTags() {
    const [nextPages, nextTags] = await Promise.all([pagesApi.list(), tagsApi.list()]);
    workspace.replaceAllPages(nextPages);
    taxonomy.setTagEntities(nextTags);
    return { pages: nextPages, tags: nextTags };
  }

  async function getTagEntity(name) {
    const matches = (tag) => tag.name.localeCompare(name, "ko-KR", { sensitivity: "accent" }) === 0;
    const cached = taxonomy.tagEntities.find(matches);
    if (cached) return cached;
    const fresh = await tagsApi.list();
    taxonomy.setTagEntities(fresh);
    return fresh.find(matches) ?? null;
  }

  async function addTag(tag, pageId, tone) {
    if (!(await workspace.flushDraft())) return;
    const page = workspace.pages.find((item) => item.id === pageId) ?? (workspace.draft?.id === pageId ? workspace.draft : null);
    if (!page) return;
    try {
      const existingTag = await getTagEntity(tag);
      if (!existingTag) await tagsApi.create(tag, tagTone(tag, { [tag]: tone }));
      const saved = await pagesApi.update(page.id, { tags: normalizeTags([...(page.tags ?? []), tag]) });
      workspace.replaceSavedPages([saved]);
      await taxonomy.loadTaxonomy();
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function renameTag(tag, nextName) {
    if (!(await workspace.flushDraft())) return;
    try {
      const entity = await getTagEntity(tag);
      if (!entity) return;
      await tagsApi.update(entity.id, { name: nextName });
      await refreshPagesAndTags();
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function deleteTag(tag) {
    if (!window.confirm(`“${tag}” 태그를 모든 노트에서 삭제할까요?`)) return;
    if (!(await workspace.flushDraft())) return;
    try {
      const entity = await getTagEntity(tag);
      if (!entity) return;
      await tagsApi.remove(entity.id);
      await refreshPagesAndTags();
      setSelectedTag("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function setTagColor(tag, tone) {
    try {
      const entity = await getTagEntity(tag);
      if (!entity) return;
      const updated = await tagsApi.update(entity.id, { color: tone });
      taxonomy.setTagEntities((current) => current.map((item) => item.id === updated.id ? updated : item));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  return {
    folderDeleteCandidate,
    deletingFolder,
    setFolderDeleteCandidate,
    createFolder,
    renameFolder,
    requestDeleteFolder,
    confirmDeleteFolder,
    addTag,
    renameTag,
    deleteTag,
    setTagColor,
  };
}
