import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { setPageLocation } from "./app/pageState";
import ConfirmDialog from "./components/ConfirmDialog";
import MobileBottomNav from "./components/MobileBottomNav";
import PageContextMenu from "./components/PageContextMenu";
import Sidebar from "./components/Sidebar";
import WorkspaceView from "./components/WorkspaceView";
import usePageWorkspace from "./hooks/usePageWorkspace";
import useTaxonomy from "./hooks/useTaxonomy";
import useTaxonomyActions from "./hooks/useTaxonomyActions";
import useTrash from "./hooks/useTrash";
import useWorkspaceSettings from "./hooks/useWorkspaceSettings";

export default function App() {
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState("home");
  const [selectedTag, setSelectedTag] = useState("");
  const [activeFolderId, setActiveFolderId] = useState("");
  const [pageMenu, setPageMenu] = useState(null);

  const taxonomy = useTaxonomy({ setError });
  const settings = useWorkspaceSettings({ setError });
  const workspace = usePageWorkspace({
    folderEntities: taxonomy.folderEntities,
    loadTaxonomy: taxonomy.loadTaxonomy,
    setError,
    setView,
  });
  const taxonomyActions = useTaxonomyActions({
    activeFolderId,
    setActiveFolderId,
    setError,
    setSelectedTag,
    setView,
    taxonomy,
    workspace,
  });
  const trash = useTrash({ onRestore: workspace.addRestoredPage, setError });

  useEffect(() => {
    settings.loadSettings();
  }, [settings.loadSettings]);

  useEffect(() => {
    taxonomy.loadTaxonomy();
  }, [taxonomy.loadTaxonomy]);

  const workspaceFolders = useMemo(() => taxonomy.folderEntities.map((folder) => ({
    ...folder,
    pageCount: workspace.pages.filter((page) => page.folderId === folder.id).length,
  })), [taxonomy.folderEntities, workspace.pages]);
  const activeFolder = useMemo(
    () => workspaceFolders.find((folder) => folder.id === activeFolderId) ?? null,
    [activeFolderId, workspaceFolders],
  );
  const tagColors = useMemo(() => ({
    ...(settings.settings.tagColors ?? {}),
    ...Object.fromEntries(taxonomy.tagEntities.map((tag) => [tag.name, tag.color])),
  }), [settings.settings.tagColors, taxonomy.tagEntities]);
  const editorSettings = useMemo(
    () => ({ ...settings.settings, tagColors }),
    [settings.settings, tagColors],
  );

  const closePageMenu = useCallback(() => setPageMenu(null), []);
  const openPageMenu = useCallback((event, page) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const fromPointer = event.type === "contextmenu" && (event.clientX !== 0 || event.clientY !== 0);
    setPageMenu({
      page,
      pageId: page.id,
      x: fromPointer ? event.clientX : rect.right + 5,
      y: fromPointer ? event.clientY : rect.bottom + 4,
    });
  }, []);

  function reloadWorkspace() {
    workspace.loadPages();
    settings.loadSettings();
    taxonomy.loadTaxonomy();
  }

  async function createPage(folder) {
    const page = await workspace.createPage(folder);
    if (!page) return;
    setSidebarOpen(false);
    setView("editor");
  }

  async function createFromTemplate(template) {
    const page = await workspace.createFromTemplate(template);
    if (page) setView("editor");
  }

  async function selectPage(page) {
    if (!(await workspace.selectPage(page))) return;
    setSidebarOpen(false);
    setView("editor");
  }

  async function duplicatePage(page) {
    const duplicate = await workspace.duplicatePage(page);
    if (!duplicate) return;
    setSidebarOpen(false);
    setView("editor");
    return duplicate;
  }

  async function importPages(entries) {
    const page = await workspace.importPages(entries);
    if (page) setView("editor");
  }

  function navigate(nextView) {
    if (nextView === "trash") trash.loadTrash();
    if (nextView === "tags" || nextView === "home") taxonomy.loadTaxonomy();
    if (nextView !== "editor") setPageLocation("");
    setView(nextView);
    if (nextView !== "search") setSidebarOpen(false);
  }

  function openFolder(folder) {
    setActiveFolderId(folder.id);
    setPageLocation("");
    setView("folder");
    setSidebarOpen(false);
  }

  function search(value) {
    workspace.setQuery(value);
    setView("search");
  }

  async function openSettings() {
    if (!(await workspace.flushDraft())) return;
    setView("settings");
    setSidebarOpen(false);
  }

  async function confirmDeletePage() {
    const hasRemainingPages = await workspace.confirmDelete();
    if (hasRemainingPages === false) setView("home");
  }

  const commands = {
    createPage,
    createFromTemplate,
    duplicatePage,
    importPages,
    navigate,
    openFolder,
    openPageMenu,
    openSidebar: () => setSidebarOpen(true),
    search,
    selectPage,
    showEditor: () => setView("editor"),
    showTemplates: () => setView("templates"),
  };

  const showRecovery = Boolean(workspace.draft)
    && (!workspace.connected || workspace.recoveredDraft || workspace.saveState === "offline");
  const showMobileTabs = ["home", "all", "folder", "favorites", "tags", "search", "trash", "settings"].includes(view)
    || (view === "editor" && !workspace.draft);
  const contextMenuPage = pageMenu
    ? (workspace.draft?.id === pageMenu.pageId
      ? workspace.draft
      : workspace.pages.find((page) => page.id === pageMenu.pageId) ?? pageMenu.page)
    : null;

  return (
    <div className={`app-shell ${showRecovery ? "has-recovery-banner" : ""} ${showMobileTabs ? "has-mobile-tabs" : ""}`} data-view={view}>
      <Sidebar
        open={sidebarOpen}
        pages={workspace.pages}
        folders={workspaceFolders}
        selectedId={workspace.selectedId}
        query={workspace.query}
        loading={workspace.loading}
        view={view}
        onQueryChange={search}
        onCreate={createPage}
        onCreateFolder={taxonomyActions.createFolder}
        onRenameFolder={taxonomyActions.renameFolder}
        onDeleteFolder={taxonomyActions.requestDeleteFolder}
        onSelect={selectPage}
        onOpenPageMenu={openPageMenu}
        onNavigate={navigate}
        onOpenSettings={openSettings}
        onClose={() => setSidebarOpen(false)}
        connected={workspace.connected}
      />

      {showRecovery && (
        <div className="recovery-banner" role="status">
          <AlertCircle aria-hidden="true" size={17} />
          <span>{workspace.connected ? "복구한 변경 내용을 다시 저장하고 있습니다." : "저장 서비스에 연결할 수 없어 변경 내용을 이 기기에 보관했습니다."}</span>
          <button type="button" aria-label="다시 저장" onClick={() => workspace.retryPendingSave(reloadWorkspace)}><RefreshCw aria-hidden="true" size={15} /><span>다시 저장</span></button>
        </div>
      )}

      {error && !showRecovery && (
        <div className="error-banner" role="alert">
          <AlertCircle aria-hidden="true" size={17} />
          <span>{error}</span>
          <button type="button" onClick={reloadWorkspace}><RefreshCw aria-hidden="true" size={15} /> 다시 시도</button>
        </div>
      )}

      <WorkspaceView
        activeFolder={activeFolder}
        activeFolderId={activeFolderId}
        commands={commands}
        editorSettings={editorSettings}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        settings={settings}
        tagColors={tagColors}
        taxonomy={taxonomy}
        taxonomyActions={taxonomyActions}
        trash={trash}
        view={view}
        workspace={workspace}
        workspaceFolders={workspaceFolders}
      />

      <PageContextMenu
        page={contextMenuPage}
        position={pageMenu}
        folders={workspaceFolders}
        onClose={closePageMenu}
        onRename={workspace.renamePage}
        onToggleFavorite={workspace.togglePageFavorite}
        onDuplicate={duplicatePage}
        onCopyLink={workspace.copyPageLink}
        onOpenNewTab={workspace.openPageInNewTab}
        onMove={workspace.movePage}
        onDelete={workspace.requestDeletePage}
      />
      <ConfirmDialog
        open={Boolean(workspace.deleteCandidate)}
        title="페이지를 휴지통으로 이동할까요?"
        description={`“${workspace.deleteCandidate?.title || "제목 없는 페이지"}”은 30일 동안 복원할 수 있습니다.`}
        confirmLabel="휴지통으로 이동"
        danger
        busy={workspace.deleting}
        onConfirm={confirmDeletePage}
        onCancel={() => workspace.setDeleteCandidate(null)}
      />
      <ConfirmDialog
        open={Boolean(taxonomyActions.folderDeleteCandidate)}
        title="폴더를 삭제할까요?"
        description={`“${taxonomyActions.folderDeleteCandidate?.name || "폴더"}” 안의 페이지는 삭제되지 않고 미분류로 이동합니다.`}
        confirmLabel="폴더 삭제"
        danger
        busy={taxonomyActions.deletingFolder}
        onConfirm={taxonomyActions.confirmDeleteFolder}
        onCancel={() => taxonomyActions.setFolderDeleteCandidate(null)}
      />
      {showMobileTabs && <MobileBottomNav view={view} onNavigate={navigate} onOpenSettings={openSettings} />}
    </div>
  );
}
