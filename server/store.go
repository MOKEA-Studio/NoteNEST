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
	db   *sql.DB
	path string
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
			deleted_at TEXT,
			favorite INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS page_versions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			page_id TEXT NOT NULL,
			title TEXT NOT NULL,
			content TEXT NOT NULL DEFAULT '',
			blocks_json TEXT NOT NULL,
			icon TEXT NOT NULL DEFAULT '',
			cover_url TEXT NOT NULL DEFAULT '',
			folder TEXT NOT NULL DEFAULT '',
			tags_json TEXT NOT NULL DEFAULT '[]',
			favorite INTEGER NOT NULL DEFAULT 0,
			saved_at TEXT NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_page_versions_page_saved ON page_versions(page_id, saved_at DESC);
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
		`ALTER TABLE pages ADD COLUMN deleted_at TEXT`,
	} {
		if _, err := db.Exec(migration); err != nil && !strings.Contains(err.Error(), "duplicate column name") {
			db.Close()
			return nil, fmt.Errorf("migrate database: %w", err)
		}
	}

	cutoff := time.Now().UTC().AddDate(0, 0, -30).Format(time.RFC3339Nano)
	tx, err := db.Begin()
	if err != nil {
		db.Close()
		return nil, fmt.Errorf("begin trash purge: %w", err)
	}
	if _, err := tx.Exec(`DELETE FROM page_versions WHERE page_id IN (SELECT id FROM pages WHERE deleted_at IS NOT NULL AND deleted_at < ?)`, cutoff); err != nil {
		tx.Rollback()
		db.Close()
		return nil, fmt.Errorf("purge expired versions: %w", err)
	}
	if _, err := tx.Exec(`DELETE FROM pages WHERE deleted_at IS NOT NULL AND deleted_at < ?`, cutoff); err != nil {
		tx.Rollback()
		db.Close()
		return nil, fmt.Errorf("purge expired trash: %w", err)
	}
	if err := tx.Commit(); err != nil {
		db.Close()
		return nil, fmt.Errorf("commit trash purge: %w", err)
	}

	return &store{db: db, path: path}, nil
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
	statement := `SELECT id, title, content, blocks_json, icon, cover_url, folder, tags_json, favorite, created_at, updated_at, deleted_at FROM pages WHERE deleted_at IS NULL`
	args := []any{}
	if query != "" {
		statement += ` AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR LOWER(folder) LIKE ? OR LOWER(tags_json) LIKE ?)`
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

func (s *store) listTrash(ctx context.Context, query string) ([]Page, error) {
	statement := `SELECT id, title, content, blocks_json, icon, cover_url, folder, tags_json, favorite, created_at, updated_at, deleted_at FROM pages WHERE deleted_at IS NOT NULL`
	args := []any{}
	if query != "" {
		statement += ` AND (LOWER(title) LIKE ? OR LOWER(folder) LIKE ?)`
		pattern := "%" + strings.ToLower(query) + "%"
		args = append(args, pattern, pattern)
	}
	statement += ` ORDER BY deleted_at DESC`
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
	page, err := s.getPageIncludingDeleted(ctx, id)
	if err != nil {
		return Page{}, err
	}
	if page.DeletedAt != nil {
		return Page{}, errNotFound
	}
	return page, nil
}

func (s *store) getPageIncludingDeleted(ctx context.Context, id string) (Page, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id, title, content, blocks_json, icon, cover_url, folder, tags_json, favorite, created_at, updated_at, deleted_at FROM pages WHERE id = ?`, id)
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
	previous := page
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

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Page{}, err
	}
	defer tx.Rollback()
	if err := insertVersionWith(ctx, tx, previous); err != nil {
		return Page{}, err
	}
	result, err := tx.ExecContext(ctx,
		`UPDATE pages SET title = ?, content = ?, blocks_json = ?, icon = ?, cover_url = ?, folder = ?, tags_json = ?, favorite = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
		page.Title, page.Content, string(page.Blocks), page.Icon, page.CoverURL, page.Folder, string(tagsJSON), page.Favorite,
		page.UpdatedAt.Format(time.RFC3339Nano), page.ID)
	if err != nil {
		return Page{}, err
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return Page{}, errNotFound
	}
	if err := tx.Commit(); err != nil {
		return Page{}, err
	}
	return page, nil
}

func (s *store) deletePage(ctx context.Context, id string) error {
	page, err := s.getPage(ctx, id)
	if err != nil {
		return err
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if err := insertVersionWith(ctx, tx, page); err != nil {
		return err
	}
	now := time.Now().UTC().Format(time.RFC3339Nano)
	result, err := tx.ExecContext(ctx, `UPDATE pages SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`, now, now, id)
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
	return tx.Commit()
}

func (s *store) restorePage(ctx context.Context, id string) (Page, error) {
	result, err := s.db.ExecContext(ctx, `UPDATE pages SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL`,
		time.Now().UTC().Format(time.RFC3339Nano), id)
	if err != nil {
		return Page{}, err
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return Page{}, errNotFound
	}
	return s.getPage(ctx, id)
}

func (s *store) permanentlyDeletePage(ctx context.Context, id string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	result, err := tx.ExecContext(ctx, `DELETE FROM pages WHERE id = ? AND deleted_at IS NOT NULL`, id)
	if err != nil {
		return err
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return errNotFound
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM page_versions WHERE page_id = ?`, id); err != nil {
		return err
	}
	return tx.Commit()
}

func (s *store) emptyTrash(ctx context.Context) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, `DELETE FROM page_versions WHERE page_id IN (SELECT id FROM pages WHERE deleted_at IS NOT NULL)`); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM pages WHERE deleted_at IS NOT NULL`); err != nil {
		return err
	}
	return tx.Commit()
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
	settings.TagColors = sanitizeTagColors(settings.TagColors)
	if settings.Theme == "" {
		settings.Theme = "system"
	}
	if settings.LineSpacing == "" {
		settings.LineSpacing = "comfortable"
	}
	return settings, nil
}

func (s *store) insertVersion(ctx context.Context, page Page) error {
	return insertVersionWith(ctx, s.db, page)
}

type contextExecer interface {
	ExecContext(context.Context, string, ...any) (sql.Result, error)
}

func insertVersionWith(ctx context.Context, executor contextExecer, page Page) error {
	tagsJSON, err := json.Marshal(page.Tags)
	if err != nil {
		return err
	}
	_, err = executor.ExecContext(ctx, `INSERT INTO page_versions
		(page_id, title, content, blocks_json, icon, cover_url, folder, tags_json, favorite, saved_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		page.ID, page.Title, page.Content, string(page.Blocks), page.Icon, page.CoverURL, page.Folder,
		string(tagsJSON), page.Favorite, time.Now().UTC().Format(time.RFC3339Nano))
	if err != nil {
		return err
	}
	_, err = executor.ExecContext(ctx, `DELETE FROM page_versions WHERE page_id = ? AND id NOT IN
		(SELECT id FROM page_versions WHERE page_id = ? ORDER BY saved_at DESC LIMIT 50)`, page.ID, page.ID)
	return err
}

func (s *store) listVersions(ctx context.Context, pageID string) ([]PageVersion, error) {
	if _, err := s.getPage(ctx, pageID); err != nil {
		return nil, err
	}
	rows, err := s.db.QueryContext(ctx, `SELECT id, page_id, title, content, blocks_json, icon, cover_url, folder, tags_json, favorite, saved_at
		FROM page_versions WHERE page_id = ? ORDER BY saved_at DESC`, pageID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	versions := make([]PageVersion, 0)
	for rows.Next() {
		version, err := scanVersion(rows)
		if err != nil {
			return nil, err
		}
		versions = append(versions, version)
	}
	return versions, rows.Err()
}

func (s *store) restoreVersion(ctx context.Context, pageID string, versionID int64) (Page, error) {
	current, err := s.getPage(ctx, pageID)
	if err != nil {
		return Page{}, err
	}
	row := s.db.QueryRowContext(ctx, `SELECT id, page_id, title, content, blocks_json, icon, cover_url, folder, tags_json, favorite, saved_at
		FROM page_versions WHERE page_id = ? AND id = ?`, pageID, versionID)
	version, err := scanVersion(row)
	if errors.Is(err, sql.ErrNoRows) {
		return Page{}, errNotFound
	}
	if err != nil {
		return Page{}, err
	}
	tagsJSON, err := json.Marshal(version.Tags)
	if err != nil {
		return Page{}, err
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Page{}, err
	}
	defer tx.Rollback()
	if err := insertVersionWith(ctx, tx, current); err != nil {
		return Page{}, err
	}
	now := time.Now().UTC()
	result, err := tx.ExecContext(ctx, `UPDATE pages SET title = ?, content = ?, blocks_json = ?, icon = ?, cover_url = ?, folder = ?, tags_json = ?, favorite = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
		version.Title, version.Content, string(version.Blocks), version.Icon, version.CoverURL, version.Folder,
		string(tagsJSON), version.Favorite, now.Format(time.RFC3339Nano), pageID)
	if err != nil {
		return Page{}, err
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return Page{}, errNotFound
	}
	if err := tx.Commit(); err != nil {
		return Page{}, err
	}
	return s.getPage(ctx, pageID)
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
	var deletedAt sql.NullString
	if err := row.Scan(
		&page.ID, &page.Title, &page.Content, &blocks, &page.Icon, &page.CoverURL,
		&page.Folder, &tagsJSON, &favorite, &createdAt, &updatedAt, &deletedAt,
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
	if deletedAt.Valid {
		value, err := time.Parse(time.RFC3339Nano, deletedAt.String)
		if err != nil {
			return Page{}, err
		}
		page.DeletedAt = &value
	}
	return page, nil
}

func scanVersion(row scanner) (PageVersion, error) {
	var version PageVersion
	var blocks, tagsJSON, savedAt string
	var favorite int
	if err := row.Scan(&version.ID, &version.PageID, &version.Title, &version.Content, &blocks,
		&version.Icon, &version.CoverURL, &version.Folder, &tagsJSON, &favorite, &savedAt); err != nil {
		return PageVersion{}, err
	}
	if json.Valid([]byte(blocks)) {
		version.Blocks = json.RawMessage(blocks)
	} else {
		version.Blocks = json.RawMessage(emptyDocument)
	}
	if err := json.Unmarshal([]byte(tagsJSON), &version.Tags); err != nil || version.Tags == nil {
		version.Tags = make([]string, 0)
	}
	version.Favorite = favorite == 1
	var err error
	version.SavedAt, err = time.Parse(time.RFC3339Nano, savedAt)
	return version, err
}
