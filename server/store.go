package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

var errNotFound = errors.New("page not found")

type store struct {
	db *sql.DB
}

func openStore(path string) (*store, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(1)
	if _, err := db.Exec(`
		PRAGMA journal_mode = WAL;
		CREATE TABLE IF NOT EXISTS pages (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			content TEXT NOT NULL DEFAULT '',
			blocks_json TEXT NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
			icon TEXT NOT NULL DEFAULT '',
			cover_url TEXT NOT NULL DEFAULT '',
			folder TEXT NOT NULL DEFAULT '개인',
			tags_json TEXT NOT NULL DEFAULT '[]',
			favorite INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
	`); err != nil {
		db.Close()
		return nil, fmt.Errorf("initialize database: %w", err)
	}
	for _, migration := range []string{
		`ALTER TABLE pages ADD COLUMN blocks_json TEXT NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'`,
		`ALTER TABLE pages ADD COLUMN icon TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE pages ADD COLUMN cover_url TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE pages ADD COLUMN folder TEXT NOT NULL DEFAULT '개인'`,
		`ALTER TABLE pages ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]'`,
	} {
		if _, err := db.Exec(migration); err != nil && !strings.Contains(err.Error(), "duplicate column name") {
			db.Close()
			return nil, fmt.Errorf("migrate database: %w", err)
		}
	}

	return &store{db: db}, nil
}

func (s *store) close() error {
	return s.db.Close()
}

func newPageID() (string, error) {
	bytes := make([]byte, 8)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return "page_" + hex.EncodeToString(bytes), nil
}

func (s *store) listPages(ctx context.Context, query string) ([]Page, error) {
	statement := `SELECT id, title, content, blocks_json, icon, cover_url, folder, tags_json, favorite, created_at, updated_at FROM pages`
	args := []any{}
	if query != "" {
		statement += ` WHERE LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR LOWER(folder) LIKE ? OR LOWER(tags_json) LIKE ?`
		pattern := "%" + strings.ToLower(query) + "%"
		args = append(args, pattern, pattern, pattern, pattern)
	}
	statement += ` ORDER BY updated_at DESC`

	rows, err := s.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	pages := make([]Page, 0)
	for rows.Next() {
		page, err := scanPage(rows)
		if err != nil {
			return nil, err
		}
		pages = append(pages, page)
	}
	return pages, rows.Err()
}

func (s *store) getPage(ctx context.Context, id string) (Page, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id, title, content, blocks_json, icon, cover_url, folder, tags_json, favorite, created_at, updated_at FROM pages WHERE id = ?`, id)
	page, err := scanPage(row)
	if errors.Is(err, sql.ErrNoRows) {
		return Page{}, errNotFound
	}
	return page, err
}

func (s *store) createPage(ctx context.Context) (Page, error) {
	id, err := newPageID()
	if err != nil {
		return Page{}, err
	}
	now := time.Now().UTC()
	page := Page{
		ID: id, Title: "제목 없는 페이지", Blocks: json.RawMessage(emptyDocument),
		Folder: "개인", Tags: make([]string, 0),
		CreatedAt: now, UpdatedAt: now,
	}
	_, err = s.db.ExecContext(ctx,
		`INSERT INTO pages (id, title, content, blocks_json, icon, cover_url, folder, tags_json, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		page.ID, page.Title, page.Content, string(page.Blocks), page.Icon, page.CoverURL, page.Folder, "[]", page.Favorite,
		now.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano))
	return page, err
}

func (s *store) updatePage(ctx context.Context, id string, input pageInput) (Page, error) {
	page, err := s.getPage(ctx, id)
	if err != nil {
		return Page{}, err
	}
	if input.Title != nil {
		page.Title = strings.TrimSpace(*input.Title)
		if page.Title == "" {
			page.Title = "제목 없는 페이지"
		}
	}
	if input.Content != nil {
		page.Content = *input.Content
	}
	if input.Blocks != nil {
		if !json.Valid(*input.Blocks) {
			return Page{}, errors.New("invalid block document")
		}
		page.Blocks = append(json.RawMessage(nil), (*input.Blocks)...)
	}
	if input.Icon != nil {
		page.Icon = strings.TrimSpace(*input.Icon)
	}
	if input.CoverURL != nil {
		page.CoverURL = strings.TrimSpace(*input.CoverURL)
	}
	if input.Folder != nil {
		page.Folder = strings.TrimSpace(*input.Folder)
	}
	if input.Tags != nil {
		page.Tags = normalizeTags(*input.Tags)
	}
	if input.Favorite != nil {
		page.Favorite = *input.Favorite
	}
	page.UpdatedAt = time.Now().UTC()
	tagsJSON, err := json.Marshal(page.Tags)
	if err != nil {
		return Page{}, err
	}

	result, err := s.db.ExecContext(ctx,
		`UPDATE pages SET title = ?, content = ?, blocks_json = ?, icon = ?, cover_url = ?, folder = ?, tags_json = ?, favorite = ?, updated_at = ? WHERE id = ?`,
		page.Title, page.Content, string(page.Blocks), page.Icon, page.CoverURL, page.Folder, string(tagsJSON), page.Favorite,
		page.UpdatedAt.Format(time.RFC3339Nano), page.ID)
	if err != nil {
		return Page{}, err
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return Page{}, errNotFound
	}
	return page, nil
}

func (s *store) deletePage(ctx context.Context, id string) error {
	result, err := s.db.ExecContext(ctx, `DELETE FROM pages WHERE id = ?`, id)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return errNotFound
	}
	return nil
}

func (s *store) getSettings(ctx context.Context) (AppSettings, error) {
	settings := defaultSettings()
	var value string
	err := s.db.QueryRowContext(ctx, `SELECT value FROM settings WHERE key = 'app'`).Scan(&value)
	if errors.Is(err, sql.ErrNoRows) {
		return settings, nil
	}
	if err != nil {
		return AppSettings{}, err
	}
	if err := json.Unmarshal([]byte(value), &settings); err != nil {
		return AppSettings{}, err
	}
	if settings.CustomFonts == nil {
		settings.CustomFonts = make([]FontAsset, 0)
	}
	return settings, nil
}

func (s *store) saveSettings(ctx context.Context, settings AppSettings) (AppSettings, error) {
	value, err := json.Marshal(settings)
	if err != nil {
		return AppSettings{}, err
	}
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO settings (key, value) VALUES ('app', ?)
		ON CONFLICT(key) DO UPDATE SET value = excluded.value`, string(value))
	return settings, err
}

func normalizeTags(tags []string) []string {
	result := make([]string, 0, len(tags))
	seen := make(map[string]struct{}, len(tags))
	for _, tag := range tags {
		name := strings.TrimSpace(tag)
		key := strings.ToLower(name)
		if name == "" {
			continue
		}
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, name)
	}
	return result
}

type scanner interface {
	Scan(dest ...any) error
}

func scanPage(row scanner) (Page, error) {
	var page Page
	var favorite int
	var blocks, tagsJSON, createdAt, updatedAt string
	if err := row.Scan(
		&page.ID, &page.Title, &page.Content, &blocks, &page.Icon, &page.CoverURL,
		&page.Folder, &tagsJSON, &favorite, &createdAt, &updatedAt,
	); err != nil {
		return Page{}, err
	}
	if json.Valid([]byte(blocks)) {
		page.Blocks = json.RawMessage(blocks)
	} else {
		page.Blocks = json.RawMessage(emptyDocument)
	}
	if err := json.Unmarshal([]byte(tagsJSON), &page.Tags); err != nil || page.Tags == nil {
		page.Tags = make([]string, 0)
	}
	var err error
	page.CreatedAt, err = time.Parse(time.RFC3339Nano, createdAt)
	if err != nil {
		return Page{}, err
	}
	page.UpdatedAt, err = time.Parse(time.RFC3339Nano, updatedAt)
	if err != nil {
		return Page{}, err
	}
	page.Favorite = favorite == 1
	return page, nil
}
