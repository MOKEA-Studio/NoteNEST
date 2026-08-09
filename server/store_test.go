package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"path/filepath"
	"testing"
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

	if err := dataStore.deletePage(ctx, created.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := dataStore.getPage(ctx, created.ID); err != errNotFound {
		t.Fatalf("expected errNotFound, got %v", err)
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
	settings.CustomFonts = []FontAsset{{Name: "나의 폰트", URL: settings.FontFamily}}
	if _, err := dataStore.saveSettings(context.Background(), settings); err != nil {
		t.Fatal(err)
	}
	loaded, err := dataStore.getSettings(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if loaded.FontFamily != settings.FontFamily || loaded.FontSize != 18 || len(loaded.CustomFonts) != 1 {
		t.Fatalf("unexpected settings: %#v", loaded)
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
	if created.Icon != "" || string(created.Blocks) != emptyDocument || created.Folder != "개인" || len(created.Tags) != 0 {
		t.Fatalf("migration defaults were not applied: %#v", created)
	}
}
