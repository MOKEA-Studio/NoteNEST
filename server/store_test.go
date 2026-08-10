package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"path/filepath"
	"testing"
	"time"
)

func TestPageLifecycle(t *testing.T) {
	dataStore, err := openStore(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer dataStore.close()
	ctx := context.Background()

	created, err := dataStore.createPage(ctx)
	if err != nil {
		t.Fatal(err)
	}
	title := "프로젝트 아이디어"
	content := "검색 가능한 본문"
	blocks := json.RawMessage(`{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"프로젝트"}]}]}`)
	icon := "💡"
	coverURL := "http://127.0.0.1:8787/uploads/image_test.png"
	folder := "프로젝트/기획"
	tags := []string{"아이디어", "기획", "아이디어"}
	favorite := true
	updated, err := dataStore.updatePage(ctx, created.ID, pageInput{
		Title: &title, Content: &content, Blocks: &blocks, Icon: &icon, CoverURL: &coverURL,
		Folder: &folder, Tags: &tags, Favorite: &favorite,
	})
	if err != nil {
		t.Fatal(err)
	}
	if updated.Title != title || !updated.Favorite || updated.Icon != icon || updated.CoverURL != coverURL {
		t.Fatalf("unexpected update: %#v", updated)
	}
	if string(updated.Blocks) != string(blocks) {
		t.Fatalf("unexpected blocks: %s", updated.Blocks)
	}
	if updated.Folder != folder || len(updated.Tags) != 2 {
		t.Fatalf("unexpected organization metadata: %#v", updated)
	}

	results, err := dataStore.listPages(ctx, "검색 가능")
	if err != nil {
		t.Fatal(err)
	}
	if len(results) != 1 || results[0].ID != created.ID {
		t.Fatalf("unexpected search results: %#v", results)
	}
	results, err = dataStore.listPages(ctx, "아이디어")
	if err != nil || len(results) != 1 {
		t.Fatalf("tag search failed: %#v, %v", results, err)
	}
	versions, err := dataStore.listVersions(ctx, created.ID)
	if err != nil || len(versions) != 1 {
		t.Fatalf("expected one saved version: %#v, %v", versions, err)
	}
	secondTitle := "변경된 프로젝트 아이디어"
	if _, err := dataStore.updatePage(ctx, created.ID, pageInput{Title: &secondTitle}); err != nil {
		t.Fatal(err)
	}
	versions, err = dataStore.listVersions(ctx, created.ID)
	if err != nil || len(versions) != 2 {
		t.Fatalf("expected two saved versions: %#v, %v", versions, err)
	}
	restoredVersion, err := dataStore.restoreVersion(ctx, created.ID, versions[0].ID)
	if err != nil || restoredVersion.Title != title {
		t.Fatalf("version restore failed: %#v, %v", restoredVersion, err)
	}

	if err := dataStore.deletePage(ctx, created.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := dataStore.getPage(ctx, created.ID); err != errNotFound {
		t.Fatalf("expected errNotFound, got %v", err)
	}
	trash, err := dataStore.listTrash(ctx, "프로젝트")
	if err != nil || len(trash) != 1 || trash[0].DeletedAt == nil {
		t.Fatalf("unexpected trash: %#v, %v", trash, err)
	}
	restored, err := dataStore.restorePage(ctx, created.ID)
	if err != nil || restored.DeletedAt != nil {
		t.Fatalf("restore failed: %#v, %v", restored, err)
	}
	if err := dataStore.deletePage(ctx, created.ID); err != nil {
		t.Fatal(err)
	}
	if err := dataStore.permanentlyDeletePage(ctx, created.ID); err != nil {
		t.Fatal(err)
	}
	if trash, err := dataStore.listTrash(ctx, ""); err != nil || len(trash) != 0 {
		t.Fatalf("trash should be empty: %#v, %v", trash, err)
	}
	var versionCount int
	if err := dataStore.db.QueryRow(`SELECT COUNT(*) FROM page_versions WHERE page_id = ?`, created.ID).Scan(&versionCount); err != nil || versionCount != 0 {
		t.Fatalf("page versions should be deleted, count=%d, err=%v", versionCount, err)
	}
}

func TestSettingsPersistence(t *testing.T) {
	dataStore, err := openStore(filepath.Join(t.TempDir(), "settings.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer dataStore.close()

	settings := defaultSettings()
	settings.FontFamily = "http://127.0.0.1:8787/uploads/font_test.woff2"
	settings.FontSize = 18
	settings.EditorWidth = "wide"
	settings.Theme = "dark"
	settings.LineSpacing = "relaxed"
	settings.ReduceMotion = true
	settings.CustomFonts = []FontAsset{{Name: "나의 폰트", URL: settings.FontFamily}}
	settings.TagColors = map[string]string{
		"프로젝트":  "coral",
		"참고":    "indigo",
		"":      "green",
		"잘못된 색": "violet",
	}
	if _, err := dataStore.saveSettings(context.Background(), settings); err != nil {
		t.Fatal(err)
	}
	loaded, err := dataStore.getSettings(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if loaded.FontFamily != settings.FontFamily || loaded.FontSize != 18 || loaded.Theme != "dark" || loaded.LineSpacing != "relaxed" || !loaded.ReduceMotion || len(loaded.CustomFonts) != 1 {
		t.Fatalf("unexpected settings: %#v", loaded)
	}
	if len(loaded.TagColors) != 2 || loaded.TagColors["프로젝트"] != "coral" || loaded.TagColors["참고"] != "indigo" {
		t.Fatalf("unexpected settings: %#v", loaded)
	}
}

func TestBackupAndStorageInfo(t *testing.T) {
	path := filepath.Join(t.TempDir(), "backup.db")
	dataStore, err := openStore(path)
	if err != nil {
		t.Fatal(err)
	}
	defer dataStore.close()
	if _, err := dataStore.createPage(context.Background()); err != nil {
		t.Fatal(err)
	}
	backup, err := dataStore.createBackup(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if backup.Size == 0 {
		t.Fatal("backup should not be empty")
	}
	if _, err := dataStore.createBackup(context.Background()); err != nil {
		t.Fatalf("consecutive backup failed: %v", err)
	}
	storage, err := dataStore.storageInfo(filepath.Join(filepath.Dir(path), "uploads"))
	if err != nil {
		t.Fatal(err)
	}
	if storage.NotesBytes == 0 || storage.BackupsBytes == 0 || len(storage.Backups) != 2 {
		t.Fatalf("unexpected storage info: %#v", storage)
	}
}

func TestExpiredTrashPurgesPagesAndVersions(t *testing.T) {
	path := filepath.Join(t.TempDir(), "expired.db")
	dataStore, err := openStore(path)
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	page, err := dataStore.createPage(ctx)
	if err != nil {
		t.Fatal(err)
	}
	title := "만료될 페이지"
	if _, err := dataStore.updatePage(ctx, page.ID, pageInput{Title: &title}); err != nil {
		t.Fatal(err)
	}
	if err := dataStore.deletePage(ctx, page.ID); err != nil {
		t.Fatal(err)
	}
	expiredAt := time.Now().UTC().AddDate(0, 0, -31).Format(time.RFC3339Nano)
	if _, err := dataStore.db.Exec(`UPDATE pages SET deleted_at = ? WHERE id = ?`, expiredAt, page.ID); err != nil {
		t.Fatal(err)
	}
	if err := dataStore.close(); err != nil {
		t.Fatal(err)
	}

	reopened, err := openStore(path)
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.close()
	for table, query := range map[string]string{
		"pages":         `SELECT COUNT(*) FROM pages WHERE id = ?`,
		"page_versions": `SELECT COUNT(*) FROM page_versions WHERE page_id = ?`,
	} {
		var count int
		if err := reopened.db.QueryRow(query, page.ID).Scan(&count); err != nil || count != 0 {
			t.Fatalf("expired %s were not purged, count=%d, err=%v", table, count, err)
		}
	}
}

func TestLegacyDatabaseMigration(t *testing.T) {
	path := filepath.Join(t.TempDir(), "legacy.db")
	db, err := sql.Open("sqlite", path)
	if err != nil {
		t.Fatal(err)
	}
	_, err = db.Exec(`CREATE TABLE pages (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		content TEXT NOT NULL DEFAULT '',
		favorite INTEGER NOT NULL DEFAULT 0,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	)`)
	if err != nil {
		t.Fatal(err)
	}
	if err := db.Close(); err != nil {
		t.Fatal(err)
	}

	dataStore, err := openStore(path)
	if err != nil {
		t.Fatal(err)
	}
	defer dataStore.close()
	created, err := dataStore.createPage(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if created.Icon != "" || string(created.Blocks) != emptyDocument || created.FolderID == "" || created.Folder != "개인" || len(created.Tags) != 0 {
		t.Fatalf("migration defaults were not applied: %#v", created)
	}
}

func TestFolderAndTagEntities(t *testing.T) {
	dataStore, err := openStore(filepath.Join(t.TempDir(), "taxonomy.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer dataStore.close()
	ctx := context.Background()

	folders, err := dataStore.listFolders(ctx)
	if err != nil || len(folders) != 1 || folders[0].Name != "개인" {
		t.Fatalf("expected the default folder, got %#v, %v", folders, err)
	}
	projectFolder, err := dataStore.createFolder(ctx, "프로젝트")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := dataStore.createFolder(ctx, "미분류"); !errors.Is(err, errInvalid) {
		t.Fatalf("the virtual unfiled section must be reserved, got %v", err)
	}
	page, err := dataStore.createPageInFolder(ctx, projectFolder.ID)
	if err != nil {
		t.Fatal(err)
	}
	if page.FolderID != projectFolder.ID || page.Folder != projectFolder.Name {
		t.Fatalf("page was not created in the requested folder: %#v", page)
	}
	renamedFolder, err := dataStore.updateFolder(ctx, projectFolder.ID, "제품")
	if err != nil || renamedFolder.Name != "제품" {
		t.Fatalf("folder rename failed: %#v, %v", renamedFolder, err)
	}
	page, err = dataStore.getPage(ctx, page.ID)
	if err != nil || page.Folder != "제품" {
		t.Fatalf("folder rename was not reflected on the page: %#v, %v", page, err)
	}
	if err := dataStore.deleteFolder(ctx, projectFolder.ID); err != nil {
		t.Fatal(err)
	}
	page, err = dataStore.getPage(ctx, page.ID)
	if err != nil || page.FolderID != "" || page.Folder != "미분류" {
		t.Fatalf("folder deletion did not unfile the page: %#v, %v", page, err)
	}

	name := "기획"
	color := "coral"
	planningTag, err := dataStore.createTag(ctx, tagInput{Name: &name, Color: &color})
	if err != nil {
		t.Fatal(err)
	}
	tagNames := []string{name}
	page, err = dataStore.updatePage(ctx, page.ID, pageInput{Tags: &tagNames})
	if err != nil {
		t.Fatal(err)
	}
	tags, err := dataStore.listTags(ctx)
	if err != nil || len(tags) != 1 || tags[0].PageCount != 1 || tags[0].Color != color {
		t.Fatalf("tag assignment was not synchronized: %#v, %v", tags, err)
	}
	renamedTag := "로드맵"
	newColor := "indigo"
	updatedTag, err := dataStore.updateTag(ctx, planningTag.ID, tagInput{Name: &renamedTag, Color: &newColor})
	if err != nil || updatedTag.Name != renamedTag || updatedTag.Color != newColor {
		t.Fatalf("tag update failed: %#v, %v", updatedTag, err)
	}
	page, err = dataStore.getPage(ctx, page.ID)
	if err != nil || len(page.Tags) != 1 || page.Tags[0] != renamedTag {
		t.Fatalf("tag rename was not reflected on the page: %#v, %v", page, err)
	}
	mergeName := "출시"
	mergeColor := "cyan"
	mergeTarget, err := dataStore.createTag(ctx, tagInput{Name: &mergeName, Color: &mergeColor})
	if err != nil {
		t.Fatal(err)
	}
	mergedNames := []string{renamedTag, mergeName}
	if _, err := dataStore.updatePage(ctx, page.ID, pageInput{Tags: &mergedNames}); err != nil {
		t.Fatal(err)
	}
	mergedTag, err := dataStore.updateTag(ctx, planningTag.ID, tagInput{Name: &mergeName})
	if err != nil || mergedTag.ID != mergeTarget.ID {
		t.Fatalf("tag merge failed: %#v, %v", mergedTag, err)
	}
	page, err = dataStore.getPage(ctx, page.ID)
	if err != nil || len(page.Tags) != 1 || page.Tags[0] != mergeName {
		t.Fatalf("tag merge left duplicate page tags: %#v, %v", page, err)
	}
	if err := dataStore.deleteTag(ctx, mergedTag.ID); err != nil {
		t.Fatal(err)
	}
	page, err = dataStore.getPage(ctx, page.ID)
	if err != nil || len(page.Tags) != 0 {
		t.Fatalf("tag deletion was not reflected on the page: %#v, %v", page, err)
	}
}
