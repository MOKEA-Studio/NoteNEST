import { lazy, Suspense } from "react";
import EmptyState from "./EmptyState";
import HomePage from "./HomePage";
import LibraryPage from "./LibraryPage";
import SearchPage from "./SearchPage";
import SettingsPage from "./SettingsPage";
import TagsPage from "./TagsPage";
import TemplateGallery from "./TemplateGallery";
import TrashPage from "./TrashPage";

const Editor = lazy(() => import("./Editor"));

export default function WorkspaceView({
  activeFolder,
  activeFolderId,
  commands,
  editorSettings,
  selectedTag,
  setSelectedTag,
  settings,
  tagColors,
  taxonomy,
  taxonomyActions,
  trash,
  view,
  workspace,
  workspaceFolders,
}) {
  if (view === "home") {
    return (
      <HomePage
        pages={workspace.pages}
        folders={workspaceFolders}
        tags={taxonomy.tagEntities}
        onCreate={commands.createPage}
        onSelect={commands.selectPage}
        onNavigate={commands.navigate}
        onOpenFolder={commands.openFolder}
        onOpenPageMenu={commands.openPageMenu}
        onOpenSidebar={commands.openSidebar}
      />
    );
  }

  if (view === "settings") {
    return (
      <SettingsPage
        settings={settings.settings}
        pages={workspace.pages}
        currentPage={workspace.draft}
        onSave={settings.saveSettings}
        onImport={commands.importPages}
        onBack={commands.showEditor}
        onOpenSidebar={commands.openSidebar}
      />
    );
  }

  if (view === "search") {
    return (
      <SearchPage
        query={workspace.query}
        pages={workspace.pages}
        onQueryChange={commands.search}
        onSelect={commands.selectPage}
        onOpenPageMenu={commands.openPageMenu}
        onOpenSidebar={commands.openSidebar}
      />
    );
  }

  if (view === "all" || view === "favorites" || view === "folder") {
    return (
      <LibraryPage
        key={`${view}-${activeFolderId}`}
        title={view === "favorites" ? "즐겨찾기" : "모든 노트"}
        pages={view === "favorites" ? workspace.favoritePages : workspace.pages}
        allFolders={workspaceFolders}
        folderFilter={view === "folder" ? activeFolder?.name ?? "" : ""}
        selectedId={workspace.selectedId}
        onSelect={commands.selectPage}
        onCreate={commands.createPage}
        onUpdatePage={workspace.updatePage}
        onOpenPageMenu={commands.openPageMenu}
        tagColors={tagColors}
        onOpenSidebar={commands.openSidebar}
      />
    );
  }

  if (view === "tags") {
    return (
      <TagsPage
        pages={workspace.pages}
        tagEntities={taxonomy.tagEntities}
        selectedId={workspace.selectedId}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        onSelect={commands.selectPage}
        onAddTag={taxonomyActions.addTag}
        onRenameTag={taxonomyActions.renameTag}
        onDeleteTag={taxonomyActions.deleteTag}
        onSetTagColor={taxonomyActions.setTagColor}
        onOpenPageMenu={commands.openPageMenu}
        tagColors={tagColors}
        onOpenSidebar={commands.openSidebar}
      />
    );
  }

  if (view === "trash") {
    return (
      <TrashPage
        pages={trash.pages}
        loading={trash.loading}
        onRestore={trash.restorePage}
        onRemove={trash.removePage}
        onEmpty={trash.emptyTrash}
        onOpenSidebar={commands.openSidebar}
      />
    );
  }

  if (view === "templates") {
    return (
      <TemplateGallery
        onCreate={commands.createFromTemplate}
        onCancel={commands.showEditor}
        onOpenSidebar={commands.openSidebar}
      />
    );
  }

  if (!workspace.draft) {
    return (
      <EmptyState
        hasPages={workspace.hasPages}
        onCreate={commands.createPage}
        onCreateTemplate={commands.showTemplates}
        onOpenSidebar={commands.openSidebar}
      />
    );
  }

  return (
    <Suspense fallback={<main className="editor-shell"><div className="editor-loading">편집기를 준비하는 중...</div></main>}>
      <Editor
        key={workspace.draft.id}
        page={workspace.draft}
        folders={workspaceFolders}
        saveState={workspace.saveState}
        settings={editorSettings}
        onChange={workspace.changeDraft}
        onCopyLink={workspace.copyPageLink}
        onCreate={commands.createPage}
        onDelete={() => workspace.requestDeletePage(workspace.draft)}
        onDuplicate={commands.duplicatePage}
        onOpenNewTab={workspace.openPageInNewTab}
        onRestoreVersion={workspace.restoreVersion}
        onOpenSidebar={commands.openSidebar}
      />
    </Suspense>
  );
}
