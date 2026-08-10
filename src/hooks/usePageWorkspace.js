import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pagesApi, versionsApi } from "../api";
import {
  clearPendingDraft,
  pageChanges,
  pageSignature,
  readPendingDraft,
  rememberPendingDraft,
  setPageLocation,
  sortByUpdatedAt,
} from "../app/pageState";
import { templatePlainText } from "../templates";
import { normalizeTags, pageTitle } from "../utils";

export default function usePageWorkspace({ folderEntities, loadTaxonomy, setError, setView }) {
  const [pages, setPages] = useState([]);
  const [draft, setDraft] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("saved");
  const [connected, setConnected] = useState(true);
  const [recoveredDraft, setRecoveredDraft] = useState(false);
  const [retrySequence, setRetrySequence] = useState(0);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const lastSavedRef = useRef("");
  const draftRef = useRef(null);
  const saveSequenceRef = useRef(0);
  const saveTimerRef = useRef(null);
  const saveQueueRef = useRef(Promise.resolve());

  draftRef.current = draft;

  function queuePageSave(page) {
    const operation = saveQueueRef.current
      .catch(() => null)
      .then(() => pagesApi.update(page.id, pageChanges(page)));
    saveQueueRef.current = operation;
    return operation;
  }

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pagesApi.list();
      setPages(data);
      setError("");
      setConnected(true);
      if (data.length > 0) {
        const pending = readPendingDraft();
        const current = draftRef.current;
        const linkedPageId = new URLSearchParams(window.location.search).get("page");
        const cachedPage = pending ? data.find((page) => page.id === pending.page.id) : null;
        const serverPage = cachedPage ?? data.find((page) => page.id === linkedPageId) ?? data.find((page) => page.id === current?.id) ?? data[0];
        const canRecover = cachedPage && pageSignature(pending.page) !== pageSignature(cachedPage);
        const selected = canRecover ? { ...cachedPage, ...pageChanges(pending.page) } : serverPage;
        lastSavedRef.current = pageSignature(serverPage);
        setDraft(selected);
        setRecoveredDraft(Boolean(canRecover));
        if (linkedPageId && serverPage.id === linkedPageId) setView("editor");
        if (!canRecover) clearPendingDraft(pending?.page?.id);
      } else {
        setDraft(null);
        lastSavedRef.current = "";
        setRecoveredDraft(false);
        clearPendingDraft();
      }
    } catch (requestError) {
      setError(requestError.message);
      setConnected(false);
      const pending = readPendingDraft();
      if (pending?.page) {
        setPages([pending.page]);
        setDraft(pending.page);
        lastSavedRef.current = pending.baseSignature ?? "";
        setRecoveredDraft(true);
        setSaveState("offline");
      }
    } finally {
      setLoading(false);
    }
  }, [setError, setView]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  useEffect(() => {
    const retryWhenOnline = () => setRetrySequence((current) => current + 1);
    window.addEventListener("online", retryWhenOnline);
    return () => window.removeEventListener("online", retryWhenOnline);
  }, []);

  useEffect(() => {
    if (!draft) return undefined;
    const signature = pageSignature(draft);
    if (signature === lastSavedRef.current) return undefined;

    rememberPendingDraft(draft, lastSavedRef.current);
    const sequence = ++saveSequenceRef.current;
    setSaveState("saving");
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const saved = await queuePageSave(draft);
        if (sequence !== saveSequenceRef.current) return;
        lastSavedRef.current = pageSignature(saved);
        clearPendingDraft(saved.id);
        setDraft(saved);
        setPages((current) => sortByUpdatedAt(
          current.some((page) => page.id === saved.id)
            ? current.map((page) => (page.id === saved.id ? saved : page))
            : [saved, ...current],
        ));
        setSaveState("saved");
        setConnected(true);
        setRecoveredDraft(false);
      } catch {
        if (sequence === saveSequenceRef.current) {
          setSaveState("offline");
          setConnected(false);
        }
      }
    }, 700);

    return () => {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    };
  }, [draft, retrySequence]);

  const favoritePages = useMemo(() => pages.filter((page) => page.favorite), [pages]);

  async function flushDraft() {
    if (!draft || pageSignature(draft) === lastSavedRef.current) return true;
    window.clearTimeout(saveTimerRef.current);
    saveSequenceRef.current += 1;
    rememberPendingDraft(draft, lastSavedRef.current);
    setSaveState("saving");
    try {
      const saved = await queuePageSave(draft);
      lastSavedRef.current = pageSignature(saved);
      clearPendingDraft(saved.id);
      setDraft(saved);
      setPages((current) => sortByUpdatedAt(current.map((page) => (page.id === saved.id ? saved : page))));
      setSaveState("saved");
      setConnected(true);
      setRecoveredDraft(false);
      return true;
    } catch {
      setSaveState("offline");
      setConnected(false);
      return false;
    }
  }

  function retryPendingSave(reloadWorkspace) {
    setError("");
    if (connected) setRetrySequence((current) => current + 1);
    else reloadWorkspace();
  }

  function replaceSavedPages(savedPages) {
    const savedById = new Map(savedPages.map((page) => [page.id, page]));
    setPages((current) => sortByUpdatedAt(current.map((page) => savedById.get(page.id) ?? page)));
    setDraft((current) => {
      const saved = current ? savedById.get(current.id) : null;
      if (!saved) return current;
      lastSavedRef.current = pageSignature(saved);
      return saved;
    });
  }

  function replaceAllPages(nextPages) {
    setPages(nextPages);
    setDraft((current) => {
      if (!current) return current;
      const fresh = nextPages.find((page) => page.id === current.id);
      if (!fresh) return current;
      lastSavedRef.current = pageSignature(fresh);
      return fresh;
    });
  }

  function replaceFolderName(folderId, name) {
    setPages((current) => current.map((page) => page.folderId === folderId ? { ...page, folder: name } : page));
    setDraft((current) => current?.folderId === folderId ? { ...current, folder: name } : current);
  }

  function detachFolder(folderId) {
    setPages((current) => current.map((page) => page.folderId === folderId ? { ...page, folderId: "", folder: "미분류" } : page));
    setDraft((current) => {
      if (current?.folderId !== folderId) return current;
      const nextDraft = { ...current, folderId: "", folder: "미분류" };
      lastSavedRef.current = pageSignature(nextDraft);
      return nextDraft;
    });
  }

  function resolveFolderId(folder) {
    if (folder && typeof folder === "object") return folder.id ?? "";
    const value = typeof folder === "string" ? folder.trim() : "";
    return folderEntities.find((item) => item.id === value || item.name === value)?.id ?? "";
  }

  async function createPage(folder) {
    if (!(await flushDraft())) return;
    try {
      const page = await pagesApi.create({ folderId: resolveFolderId(folder) });
      setQuery("");
      setPages((current) => [page, ...current]);
      setDraft(page);
      lastSavedRef.current = pageSignature(page);
      setSaveState("saved");
      setPageLocation(page.id);
      setError("");
      return page;
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function createFromTemplate(template) {
    if (!(await flushDraft())) return;
    try {
      const created = await pagesApi.create();
      const page = await pagesApi.update(created.id, {
        title: template.pageTitle,
        content: templatePlainText(template),
        blocks: template.blocks,
        folder: template.folder,
        tags: template.tags,
      });
      setPages((current) => [page, ...current]);
      setDraft(page);
      lastSavedRef.current = pageSignature(page);
      setSaveState("saved");
      setPageLocation(page.id);
      await loadTaxonomy();
      setError("");
      return page;
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function selectPage(page) {
    if (page.id === draft?.id) {
      setPageLocation(page.id);
      return true;
    }
    if (!(await flushDraft())) return false;
    saveSequenceRef.current += 1;
    setDraft(page);
    lastSavedRef.current = pageSignature(page);
    setSaveState("saved");
    setPageLocation(page.id);
    return true;
  }

  function changeDraft(changes) {
    if (!draft) return;
    setDraft((current) => ({ ...current, ...changes }));
    setPages((current) => current.map((page) => (page.id === draft.id ? { ...page, ...changes } : page)));
  }

  async function updatePage(page, changes) {
    if (page.id === draft?.id) {
      changeDraft(changes);
      return;
    }
    try {
      const saved = await pagesApi.update(page.id, changes);
      replaceSavedPages([saved]);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function renamePage(page, title) {
    const current = page.id === draft?.id ? draft : pages.find((item) => item.id === page.id) ?? page;
    if (current.id === draft?.id) {
      changeDraft({ title });
      return;
    }
    try {
      const saved = await pagesApi.update(current.id, { title });
      replaceSavedPages([saved]);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function togglePageFavorite(page) {
    const current = page.id === draft?.id ? draft : pages.find((item) => item.id === page.id) ?? page;
    if (current.id === draft?.id) {
      changeDraft({ favorite: !current.favorite });
      return;
    }
    try {
      const saved = await pagesApi.update(current.id, { favorite: !current.favorite });
      replaceSavedPages([saved]);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function duplicatePage(page) {
    const source = page.id === draft?.id ? draft : pages.find((item) => item.id === page.id) ?? page;
    if (!(await flushDraft())) return;
    try {
      const created = await pagesApi.create({ folderId: source.folderId ?? "" });
      const duplicate = await pagesApi.update(created.id, {
        ...pageChanges(source),
        title: `${pageTitle(source)} 복사본`,
        favorite: false,
      });
      setPages((current) => sortByUpdatedAt([duplicate, ...current]));
      setDraft(duplicate);
      lastSavedRef.current = pageSignature(duplicate);
      setSaveState("saved");
      setRecoveredDraft(false);
      setQuery("");
      setPageLocation(duplicate.id);
      setError("");
      return duplicate;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function requestDeletePage(page) {
    if (!page) return;
    if (page.id === draft?.id && !(await flushDraft())) return;
    setDeleteCandidate(page);
  }

  async function movePage(page, folderId) {
    const current = page.id === draft?.id ? draft : pages.find((item) => item.id === page.id) ?? page;
    if (current.id === draft?.id && !(await flushDraft())) throw new Error("현재 페이지를 저장하지 못했습니다.");
    try {
      const saved = await pagesApi.update(current.id, { folderId });
      replaceSavedPages([saved]);
      setError("");
      return saved;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function copyPageLink(page) {
    const url = new URL(window.location.href);
    url.searchParams.set("page", page.id);
    await navigator.clipboard.writeText(url.toString());
  }

  function openPageInNewTab(page) {
    const url = new URL(window.location.href);
    url.searchParams.set("page", page.id);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  async function confirmDelete() {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await pagesApi.remove(deleteCandidate.id);
      clearPendingDraft(deleteCandidate.id);
      const remaining = pages.filter((page) => page.id !== deleteCandidate.id);
      setPages(remaining);
      if (draft?.id === deleteCandidate.id) {
        const nextPage = remaining[0] ?? null;
        setDraft(nextPage);
        lastSavedRef.current = nextPage ? pageSignature(nextPage) : "";
        setSaveState("saved");
        setRecoveredDraft(false);
        if (nextPage) setPageLocation(nextPage.id);
        else setPageLocation("");
      }
      setDeleteCandidate(null);
      return remaining.length > 0;
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeleting(false);
    }
  }

  async function restoreVersion(versionId) {
    if (!draft || !(await flushDraft())) return null;
    try {
      const restored = await versionsApi.restore(draft.id, versionId);
      lastSavedRef.current = pageSignature(restored);
      setDraft(restored);
      setPages((current) => sortByUpdatedAt(current.map((page) => page.id === restored.id ? restored : page)));
      setSaveState("saved");
      await loadTaxonomy();
      return restored;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function importPages(entries) {
    if (!(await flushDraft())) return;
    try {
      const imported = [];
      for (const entry of entries) {
        const created = await pagesApi.create();
        imported.push(await pagesApi.update(created.id, {
          title: entry.title || "가져온 페이지",
          content: entry.content || "",
          blocks: entry.blocks,
          icon: entry.icon || "",
          coverUrl: entry.coverUrl || "",
          folder: entry.folder || "가져온 노트",
          tags: normalizeTags(entry.tags || ["가져오기"]),
          favorite: Boolean(entry.favorite),
        }));
      }
      if (!imported.length) return;
      setPages((current) => sortByUpdatedAt([...imported, ...current]));
      setDraft(imported[0]);
      lastSavedRef.current = pageSignature(imported[0]);
      setPageLocation(imported[0].id);
      setSaveState("saved");
      await loadTaxonomy();
      return imported[0];
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  function addRestoredPage(restored) {
    setPages((current) => sortByUpdatedAt([restored, ...current]));
    if (!draft) {
      setDraft(restored);
      lastSavedRef.current = pageSignature(restored);
    }
  }

  return {
    pages,
    draft,
    query,
    loading,
    saveState,
    connected,
    recoveredDraft,
    deleteCandidate,
    deleting,
    selectedId: draft?.id ?? null,
    hasPages: pages.length > 0,
    favoritePages,
    setQuery,
    setDeleteCandidate,
    loadPages,
    flushDraft,
    retryPendingSave,
    replaceSavedPages,
    replaceAllPages,
    replaceFolderName,
    detachFolder,
    createPage,
    createFromTemplate,
    selectPage,
    changeDraft,
    updatePage,
    renamePage,
    togglePageFavorite,
    duplicatePage,
    requestDeletePage,
    movePage,
    copyPageLink,
    openPageInNewTab,
    confirmDelete,
    restoreVersion,
    importPages,
    addRestoredPage,
  };
}
