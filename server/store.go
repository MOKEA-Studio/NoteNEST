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

var (
	errNotFound = errors.New("resource not found")
	errConflict = errors.New("resource conflict")
	errInvalid  = errors.New("invalid input")
)

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
		PRAGMA foreign_keys = ON;
		PRAGMA journal_mode = WAL;
		CREATE TABLE IF NOT EXISTS pages (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			content TEXT NOT NULL DEFAULT '',
			blocks_json TEXT NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
			icon TEXT NOT NULL DEFAULT '',
			cover_url TEXT NOT NULL DEFAULT '',
			folder_id TEXT NOT NULL DEFAULT '',
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
		CREATE TABLE IF NOT EXISTS folders (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL COLLATE NOCASE UNIQUE,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS tags (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL COLLATE NOCASE UNIQUE,
			color TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS page_tags (
			page_id TEXT NOT NULL,
			tag_id TEXT NOT NULL,
			position INTEGER NOT NULL DEFAULT 0,
			PRIMARY KEY (page_id, tag_id),
			FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
			FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
		);
		CREATE INDEX IF NOT EXISTS idx_page_versions_page_saved ON page_versions(page_id, saved_at DESC);
		CREATE INDEX IF NOT EXISTS idx_page_tags_tag ON page_tags(tag_id, position);
	`); err != nil {
		db.Close()
		return nil, fmt.Errorf("initialize database: %w", err)
	}
	for _, migration := range []string{
		`ALTER TABLE pages ADD COLUMN blocks_json TEXT NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'`,
		`ALTER TABLE pages ADD COLUMN icon TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE pages ADD COLUMN cover_url TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE pages ADD COLUMN folder_id TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE pages ADD COLUMN folder TEXT NOT NULL DEFAULT '개인'`,
		`ALTER TABLE pages ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]'`,
		`ALTER TABLE pages ADD COLUMN deleted_at TEXT`,
	} {
		if _, err := db.Exec(migration); err != nil && !strings.Contains(err.Error(), "duplicate column name") {
			db.Close()
			return nil, fmt.Errorf("migrate database: %w", err)
		}
	}
	if _, err := db.Exec(`CREATE INDEX IF NOT EXISTS idx_pages_folder ON pages(folder_id, deleted_at)`); err != nil {
		db.Close()
		return nil, fmt.Errorf("index migrated database: %w", err)
	}
	if err := backfillTaxonomy(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("migrate taxonomy: %w", err)
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

func newEntityID(prefix string) (string, error) {
	bytes := make([]byte, 8)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return prefix + "_" + hex.EncodeToString(bytes), nil
}

func newPageID() (string, error) {
	return newEntityID("page")
}

func validationError(message string) error {
	return fmt.Errorf("%w: %s", errInvalid, message)
}

func conflictError(message string) error {
	return fmt.Errorf("%w: %s", errConflict, message)
}

func taxonomyName(value, fallback string) string {
	name := strings.TrimSpace(value)
	if name == "" {
		return fallback
	}
	return name
}

func defaultTagTone(name string) string {
	tones := []string{"green", "gold", "coral", "cyan", "olive", "indigo"}
	var hash uint32
	for _, character := range name {
		hash = hash*31 + uint32(character)
	}
	return tones[int(hash)%len(tones)]
}

func backfillTaxonomy(db *sql.DB) error {
	ctx := context.Background()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	colors := make(map[string]string)
	var rawSettings string
	if err := tx.QueryRowContext(ctx, `SELECT value FROM settings WHERE key = 'app'`).Scan(&rawSettings); err == nil {
		var settings AppSettings
		if json.Unmarshal([]byte(rawSettings), &settings) == nil {
			colors = sanitizeTagColors(settings.TagColors)
		}
	} else if !errors.Is(err, sql.ErrNoRows) {
		return err
	}

	folderRows, err := tx.QueryContext(ctx, `SELECT DISTINCT folder FROM pages WHERE TRIM(folder) <> ''`)
	if err != nil {
		return err
	}
	folderNames := make([]string, 0)
	for folderRows.Next() {
		var name string
		if err := folderRows.Scan(&name); err != nil {
			folderRows.Close()
			return err
		}
		folderNames = append(folderNames, taxonomyName(name, "개인"))
	}
	if err := folderRows.Close(); err != nil {
		return err
	}
	if err := folderRows.Err(); err != nil {
		return err
	}
	if len(folderNames) == 0 {
		folderNames = append(folderNames, "개인")
	}
	for _, name := range folderNames {
		if strings.EqualFold(name, "미분류") {
			if _, err := tx.ExecContext(ctx,
				`UPDATE pages SET folder_id = '', folder = '미분류' WHERE LOWER(TRIM(folder)) = LOWER(?)`, name); err != nil {
				return err
			}
			continue
		}
		folder, err := ensureFolderWith(ctx, tx, name)
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx,
			`UPDATE pages SET folder_id = ? WHERE (folder_id = '' OR folder_id IS NULL) AND LOWER(TRIM(folder)) = LOWER(?)`,
			folder.ID, name); err != nil {
			return err
		}
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM page_tags`); err != nil {
		return err
	}
	pageRows, err := tx.QueryContext(ctx, `SELECT id, tags_json FROM pages`)
	if err != nil {
		return err
	}
	type legacyPageTags struct {
		pageID string
		tags   []string
	}
	legacyTags := make([]legacyPageTags, 0)
	for pageRows.Next() {
		var pageID, tagsJSON string
		if err := pageRows.Scan(&pageID, &tagsJSON); err != nil {
			pageRows.Close()
			return err
		}
		var names []string
		if json.Unmarshal([]byte(tagsJSON), &names) != nil {
			names = nil
		}
		legacyTags = append(legacyTags, legacyPageTags{pageID: pageID, tags: normalizeTags(names)})
	}
	if err := pageRows.Close(); err != nil {
		return err
	}
	if err := pageRows.Err(); err != nil {
		return err
	}
	for _, page := range legacyTags {
		for position, name := range page.tags {
			color := colors[name]
			if color == "" {
				color = defaultTagTone(name)
			}
			tag, err := ensureTagWith(ctx, tx, name, color)
			if err != nil {
				return err
			}
			if _, err := tx.ExecContext(ctx,
				`INSERT OR IGNORE INTO page_tags (page_id, tag_id, position) VALUES (?, ?, ?)`,
				page.pageID, tag.ID, position); err != nil {
				return err
			}
		}
	}
	return tx.Commit()
}

func validateTaxonomyName(name, label string) (string, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return "", validationError(label + " 이름을 입력해주세요.")
	}
	if len([]rune(name)) > 80 {
		return "", validationError(label + " 이름은 80자 이하여야 합니다.")
	}
	return name, nil
}

func getFolderWith(ctx context.Context, executor contextStore, id string) (Folder, error) {
	var folder Folder
	var createdAt, updatedAt string
	err := executor.QueryRowContext(ctx,
		`SELECT id, name, created_at, updated_at FROM folders WHERE id = ?`, id).
		Scan(&folder.ID, &folder.Name, &createdAt, &updatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return Folder{}, errNotFound
	}
	if err != nil {
		return Folder{}, err
	}
	var parseErr error
	folder.CreatedAt, parseErr = time.Parse(time.RFC3339Nano, createdAt)
	if parseErr != nil {
		return Folder{}, parseErr
	}
	folder.UpdatedAt, parseErr = time.Parse(time.RFC3339Nano, updatedAt)
	return folder, parseErr
}

func ensureFolderWith(ctx context.Context, executor contextStore, value string) (Folder, error) {
	name, err := validateTaxonomyName(value, "폴더")
	if err != nil {
		return Folder{}, err
	}
	var id string
	err = executor.QueryRowContext(ctx, `SELECT id FROM folders WHERE name = ? COLLATE NOCASE`, name).Scan(&id)
	if err == nil {
		return getFolderWith(ctx, executor, id)
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return Folder{}, err
	}
	id, err = newEntityID("folder")
	if err != nil {
		return Folder{}, err
	}
	now := time.Now().UTC()
	if _, err := executor.ExecContext(ctx,
		`INSERT INTO folders (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`,
		id, name, now.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano)); err != nil {
		return Folder{}, err
	}
	return Folder{ID: id, Name: name, CreatedAt: now, UpdatedAt: now}, nil
}

func (s *store) listFolders(ctx context.Context) ([]Folder, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT f.id, f.name, COUNT(p.id), f.created_at, f.updated_at
		FROM folders f
		LEFT JOIN pages p ON p.folder_id = f.id AND p.deleted_at IS NULL
		GROUP BY f.id, f.name, f.created_at, f.updated_at
		ORDER BY f.name COLLATE NOCASE`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	folders := make([]Folder, 0)
	for rows.Next() {
		var folder Folder
		var createdAt, updatedAt string
		if err := rows.Scan(&folder.ID, &folder.Name, &folder.PageCount, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		folder.CreatedAt, err = time.Parse(time.RFC3339Nano, createdAt)
		if err != nil {
			return nil, err
		}
		folder.UpdatedAt, err = time.Parse(time.RFC3339Nano, updatedAt)
		if err != nil {
			return nil, err
		}
		folders = append(folders, folder)
	}
	return folders, rows.Err()
}

func (s *store) createFolder(ctx context.Context, value string) (Folder, error) {
	name, err := validateTaxonomyName(value, "폴더")
	if err != nil {
		return Folder{}, err
	}
	if strings.EqualFold(name, "미분류") {
		return Folder{}, validationError("미분류는 폴더 이름으로 사용할 수 없습니다.")
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Folder{}, err
	}
	defer tx.Rollback()
	var existingID string
	err = tx.QueryRowContext(ctx, `SELECT id FROM folders WHERE name = ? COLLATE NOCASE`, name).Scan(&existingID)
	if err == nil {
		return Folder{}, conflictError("같은 이름의 폴더가 이미 있습니다.")
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return Folder{}, err
	}
	folder, err := ensureFolderWith(ctx, tx, name)
	if err != nil {
		return Folder{}, err
	}
	if err := tx.Commit(); err != nil {
		return Folder{}, err
	}
	return folder, nil
}

func (s *store) updateFolder(ctx context.Context, id, value string) (Folder, error) {
	name, err := validateTaxonomyName(value, "폴더")
	if err != nil {
		return Folder{}, err
	}
	if strings.EqualFold(name, "미분류") {
		return Folder{}, validationError("미분류는 폴더 이름으로 사용할 수 없습니다.")
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Folder{}, err
	}
	defer tx.Rollback()
	folder, err := getFolderWith(ctx, tx, id)
	if err != nil {
		return Folder{}, err
	}
	var duplicateID string
	err = tx.QueryRowContext(ctx,
		`SELECT id FROM folders WHERE name = ? COLLATE NOCASE AND id <> ?`, name, id).Scan(&duplicateID)
	if err == nil {
		return Folder{}, conflictError("같은 이름의 폴더가 이미 있습니다.")
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return Folder{}, err
	}
	now := time.Now().UTC()
	if _, err := tx.ExecContext(ctx,
		`UPDATE folders SET name = ?, updated_at = ? WHERE id = ?`,
		name, now.Format(time.RFC3339Nano), id); err != nil {
		return Folder{}, err
	}
	if _, err := tx.ExecContext(ctx, `UPDATE pages SET folder = ? WHERE folder_id = ?`, name, id); err != nil {
		return Folder{}, err
	}
	if err := tx.Commit(); err != nil {
		return Folder{}, err
	}
	folder.Name = name
	folder.UpdatedAt = now
	return folder, nil
}

func (s *store) deleteFolder(ctx context.Context, id string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := getFolderWith(ctx, tx, id); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx,
		`UPDATE pages SET folder_id = '', folder = '미분류' WHERE folder_id = ?`, id); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM folders WHERE id = ?`, id); err != nil {
		return err
	}
	return tx.Commit()
}

func validateTagColor(color, name string) (string, error) {
	color = strings.TrimSpace(color)
	if color == "" {
		return defaultTagTone(name), nil
	}
	if _, supported := supportedTagTones[color]; !supported {
		return "", validationError("지원하지 않는 태그 색상입니다.")
	}
	return color, nil
}

func getTagWith(ctx context.Context, executor contextStore, id string) (TagRecord, error) {
	var tag TagRecord
	var createdAt, updatedAt string
	err := executor.QueryRowContext(ctx,
		`SELECT id, name, color, created_at, updated_at FROM tags WHERE id = ?`, id).
		Scan(&tag.ID, &tag.Name, &tag.Color, &createdAt, &updatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return TagRecord{}, errNotFound
	}
	if err != nil {
		return TagRecord{}, err
	}
	var parseErr error
	tag.CreatedAt, parseErr = time.Parse(time.RFC3339Nano, createdAt)
	if parseErr != nil {
		return TagRecord{}, parseErr
	}
	tag.UpdatedAt, parseErr = time.Parse(time.RFC3339Nano, updatedAt)
	return tag, parseErr
}

func ensureTagWith(ctx context.Context, executor contextStore, value, preferredColor string) (TagRecord, error) {
	name, err := validateTaxonomyName(value, "태그")
	if err != nil {
		return TagRecord{}, err
	}
	var id string
	err = executor.QueryRowContext(ctx, `SELECT id FROM tags WHERE name = ? COLLATE NOCASE`, name).Scan(&id)
	if err == nil {
		return getTagWith(ctx, executor, id)
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return TagRecord{}, err
	}
	color, err := validateTagColor(preferredColor, name)
	if err != nil {
		return TagRecord{}, err
	}
	id, err = newEntityID("tag")
	if err != nil {
		return TagRecord{}, err
	}
	now := time.Now().UTC()
	if _, err := executor.ExecContext(ctx,
		`INSERT INTO tags (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
		id, name, color, now.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano)); err != nil {
		return TagRecord{}, err
	}
	return TagRecord{ID: id, Name: name, Color: color, CreatedAt: now, UpdatedAt: now}, nil
}

func syncPageTagsWith(ctx context.Context, executor contextStore, pageID string, names []string) error {
	if _, err := executor.ExecContext(ctx, `DELETE FROM page_tags WHERE page_id = ?`, pageID); err != nil {
		return err
	}
	for position, name := range normalizeTags(names) {
		tag, err := ensureTagWith(ctx, executor, name, "")
		if err != nil {
			return err
		}
		if _, err := executor.ExecContext(ctx,
			`INSERT INTO page_tags (page_id, tag_id, position) VALUES (?, ?, ?)`,
			pageID, tag.ID, position); err != nil {
			return err
		}
	}
	return nil
}

func (s *store) listTags(ctx context.Context) ([]TagRecord, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT t.id, t.name, t.color, COUNT(p.id), t.created_at, t.updated_at
		FROM tags t
		LEFT JOIN page_tags pt ON pt.tag_id = t.id
		LEFT JOIN pages p ON p.id = pt.page_id AND p.deleted_at IS NULL
		GROUP BY t.id, t.name, t.color, t.created_at, t.updated_at
		ORDER BY t.name COLLATE NOCASE`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tags := make([]TagRecord, 0)
	for rows.Next() {
		var tag TagRecord
		var createdAt, updatedAt string
		if err := rows.Scan(&tag.ID, &tag.Name, &tag.Color, &tag.PageCount, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		tag.CreatedAt, err = time.Parse(time.RFC3339Nano, createdAt)
		if err != nil {
			return nil, err
		}
		tag.UpdatedAt, err = time.Parse(time.RFC3339Nano, updatedAt)
		if err != nil {
			return nil, err
		}
		tags = append(tags, tag)
	}
	return tags, rows.Err()
}

func (s *store) createTag(ctx context.Context, input tagInput) (TagRecord, error) {
	name := ""
	if input.Name != nil {
		name = *input.Name
	}
	name, err := validateTaxonomyName(name, "태그")
	if err != nil {
		return TagRecord{}, err
	}
	color := ""
	if input.Color != nil {
		color = *input.Color
	}
	color, err = validateTagColor(color, name)
	if err != nil {
		return TagRecord{}, err
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return TagRecord{}, err
	}
	defer tx.Rollback()
	var existingID string
	err = tx.QueryRowContext(ctx, `SELECT id FROM tags WHERE name = ? COLLATE NOCASE`, name).Scan(&existingID)
	if err == nil {
		return TagRecord{}, conflictError("같은 이름의 태그가 이미 있습니다.")
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return TagRecord{}, err
	}
	tag, err := ensureTagWith(ctx, tx, name, color)
	if err != nil {
		return TagRecord{}, err
	}
	if err := tx.Commit(); err != nil {
		return TagRecord{}, err
	}
	return tag, nil
}

type pageTagsSnapshot struct {
	pageID string
	names  []string
}

func pageTagsForTag(ctx context.Context, executor contextStore, tagID string) ([]pageTagsSnapshot, error) {
	rows, err := executor.QueryContext(ctx, `
		SELECT p.id, p.tags_json
		FROM pages p
		JOIN page_tags pt ON pt.page_id = p.id
		WHERE pt.tag_id = ?`, tagID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	pages := make([]pageTagsSnapshot, 0)
	for rows.Next() {
		var pageID, raw string
		if err := rows.Scan(&pageID, &raw); err != nil {
			return nil, err
		}
		var names []string
		if json.Unmarshal([]byte(raw), &names) != nil {
			names = nil
		}
		pages = append(pages, pageTagsSnapshot{pageID: pageID, names: normalizeTags(names)})
	}
	return pages, rows.Err()
}

func rewriteTagJSON(ctx context.Context, executor contextStore, pages []pageTagsSnapshot, oldName, newName string) error {
	for _, page := range pages {
		next := make([]string, 0, len(page.names))
		for _, name := range page.names {
			if strings.EqualFold(name, oldName) {
				if newName != "" {
					next = append(next, newName)
				}
				continue
			}
			next = append(next, name)
		}
		raw, err := json.Marshal(normalizeTags(next))
		if err != nil {
			return err
		}
		if _, err := executor.ExecContext(ctx, `UPDATE pages SET tags_json = ? WHERE id = ?`, string(raw), page.pageID); err != nil {
			return err
		}
	}
	return nil
}

func (s *store) updateTag(ctx context.Context, id string, input tagInput) (TagRecord, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return TagRecord{}, err
	}
	defer tx.Rollback()
	current, err := getTagWith(ctx, tx, id)
	if err != nil {
		return TagRecord{}, err
	}
	name := current.Name
	if input.Name != nil {
		name, err = validateTaxonomyName(*input.Name, "태그")
		if err != nil {
			return TagRecord{}, err
		}
	}
	color := current.Color
	if input.Color != nil {
		color, err = validateTagColor(*input.Color, name)
		if err != nil {
			return TagRecord{}, err
		}
	}
	affected, err := pageTagsForTag(ctx, tx, id)
	if err != nil {
		return TagRecord{}, err
	}
	var duplicateID string
	err = tx.QueryRowContext(ctx,
		`SELECT id FROM tags WHERE name = ? COLLATE NOCASE AND id <> ?`, name, id).Scan(&duplicateID)
	if err == nil {
		if _, err := tx.ExecContext(ctx, `
			INSERT OR IGNORE INTO page_tags (page_id, tag_id, position)
			SELECT page_id, ?, position FROM page_tags WHERE tag_id = ?`, duplicateID, id); err != nil {
			return TagRecord{}, err
		}
		if err := rewriteTagJSON(ctx, tx, affected, current.Name, name); err != nil {
			return TagRecord{}, err
		}
		if _, err := tx.ExecContext(ctx, `DELETE FROM tags WHERE id = ?`, id); err != nil {
			return TagRecord{}, err
		}
		if input.Color != nil {
			if _, err := tx.ExecContext(ctx,
				`UPDATE tags SET color = ?, updated_at = ? WHERE id = ?`,
				color, time.Now().UTC().Format(time.RFC3339Nano), duplicateID); err != nil {
				return TagRecord{}, err
			}
		}
		if err := tx.Commit(); err != nil {
			return TagRecord{}, err
		}
		return s.tagByID(ctx, duplicateID)
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return TagRecord{}, err
	}
	now := time.Now().UTC()
	if _, err := tx.ExecContext(ctx,
		`UPDATE tags SET name = ?, color = ?, updated_at = ? WHERE id = ?`,
		name, color, now.Format(time.RFC3339Nano), id); err != nil {
		return TagRecord{}, err
	}
	if !strings.EqualFold(current.Name, name) || current.Name != name {
		if err := rewriteTagJSON(ctx, tx, affected, current.Name, name); err != nil {
			return TagRecord{}, err
		}
	}
	if err := tx.Commit(); err != nil {
		return TagRecord{}, err
	}
	current.Name = name
	current.Color = color
	current.UpdatedAt = now
	return current, nil
}

func (s *store) tagByID(ctx context.Context, id string) (TagRecord, error) {
	tag, err := getTagWith(ctx, s.db, id)
	if err != nil {
		return TagRecord{}, err
	}
	if err := s.db.QueryRowContext(ctx, `
		SELECT COUNT(p.id)
		FROM page_tags pt
		JOIN pages p ON p.id = pt.page_id AND p.deleted_at IS NULL
		WHERE pt.tag_id = ?`, id).Scan(&tag.PageCount); err != nil {
		return TagRecord{}, err
	}
	return tag, nil
}

func (s *store) deleteTag(ctx context.Context, id string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	tag, err := getTagWith(ctx, tx, id)
	if err != nil {
		return err
	}
	affected, err := pageTagsForTag(ctx, tx, id)
	if err != nil {
		return err
	}
	if err := rewriteTagJSON(ctx, tx, affected, tag.Name, ""); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM tags WHERE id = ?`, id); err != nil {
		return err
	}
	return tx.Commit()
}

func (s *store) listPages(ctx context.Context, query string) ([]Page, error) {
	statement := `SELECT id, title, content, blocks_json, icon, cover_url, folder_id, folder, tags_json, favorite, created_at, updated_at, deleted_at FROM pages WHERE deleted_at IS NULL`
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
	statement := `SELECT id, title, content, blocks_json, icon, cover_url, folder_id, folder, tags_json, favorite, created_at, updated_at, deleted_at FROM pages WHERE deleted_at IS NOT NULL`
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
		`SELECT id, title, content, blocks_json, icon, cover_url, folder_id, folder, tags_json, favorite, created_at, updated_at, deleted_at FROM pages WHERE id = ?`, id)
	page, err := scanPage(row)
	if errors.Is(err, sql.ErrNoRows) {
		return Page{}, errNotFound
	}
	return page, err
}

func (s *store) createPage(ctx context.Context) (Page, error) {
	return s.createPageInFolder(ctx, "")
}

func (s *store) createPageInFolder(ctx context.Context, folderID string) (Page, error) {
	id, err := newPageID()
	if err != nil {
		return Page{}, err
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Page{}, err
	}
	defer tx.Rollback()
	var folder Folder
	if strings.TrimSpace(folderID) == "" {
		folder, err = ensureFolderWith(ctx, tx, "개인")
	} else {
		folder, err = getFolderWith(ctx, tx, folderID)
	}
	if err != nil {
		return Page{}, err
	}
	now := time.Now().UTC()
	page := Page{
		ID: id, Title: "제목 없는 페이지", Blocks: json.RawMessage(emptyDocument),
		FolderID: folder.ID, Folder: folder.Name, Tags: make([]string, 0),
		CreatedAt: now, UpdatedAt: now,
	}
	_, err = tx.ExecContext(ctx,
		`INSERT INTO pages (id, title, content, blocks_json, icon, cover_url, folder_id, folder, tags_json, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		page.ID, page.Title, page.Content, string(page.Blocks), page.Icon, page.CoverURL, page.FolderID, page.Folder, "[]", page.Favorite,
		now.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano))
	if err != nil {
		return Page{}, err
	}
	if err := tx.Commit(); err != nil {
		return Page{}, err
	}
	return page, nil
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
	if input.FolderID != nil {
		targetID := strings.TrimSpace(*input.FolderID)
		if targetID == "" {
			page.FolderID = ""
			page.Folder = "미분류"
		} else {
			folder, err := getFolderWith(ctx, tx, targetID)
			if err != nil {
				return Page{}, err
			}
			page.FolderID = folder.ID
			page.Folder = folder.Name
		}
	} else if input.Folder != nil {
		name := strings.TrimSpace(*input.Folder)
		if name == "" || name == "미분류" {
			page.FolderID = ""
			page.Folder = "미분류"
		} else {
			folder, err := ensureFolderWith(ctx, tx, name)
			if err != nil {
				return Page{}, err
			}
			page.FolderID = folder.ID
			page.Folder = folder.Name
		}
	}
	if err := insertVersionWith(ctx, tx, previous); err != nil {
		return Page{}, err
	}
	result, err := tx.ExecContext(ctx,
		`UPDATE pages SET title = ?, content = ?, blocks_json = ?, icon = ?, cover_url = ?, folder_id = ?, folder = ?, tags_json = ?, favorite = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
		page.Title, page.Content, string(page.Blocks), page.Icon, page.CoverURL, page.FolderID, page.Folder, string(tagsJSON), page.Favorite,
		page.UpdatedAt.Format(time.RFC3339Nano), page.ID)
	if err != nil {
		return Page{}, err
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return Page{}, errNotFound
	}
	if err := syncPageTagsWith(ctx, tx, page.ID, page.Tags); err != nil {
		return Page{}, err
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

type contextStore interface {
	contextExecer
	QueryContext(context.Context, string, ...any) (*sql.Rows, error)
	QueryRowContext(context.Context, string, ...any) *sql.Row
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
	folderID := ""
	folderName := taxonomyName(version.Folder, "미분류")
	if folderName != "미분류" {
		folder, err := ensureFolderWith(ctx, tx, folderName)
		if err != nil {
			return Page{}, err
		}
		folderID = folder.ID
		folderName = folder.Name
	}
	now := time.Now().UTC()
	result, err := tx.ExecContext(ctx, `UPDATE pages SET title = ?, content = ?, blocks_json = ?, icon = ?, cover_url = ?, folder_id = ?, folder = ?, tags_json = ?, favorite = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
		version.Title, version.Content, string(version.Blocks), version.Icon, version.CoverURL, folderID, folderName,
		string(tagsJSON), version.Favorite, now.Format(time.RFC3339Nano), pageID)
	if err != nil {
		return Page{}, err
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return Page{}, errNotFound
	}
	if err := syncPageTagsWith(ctx, tx, pageID, version.Tags); err != nil {
		return Page{}, err
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
		&page.FolderID, &page.Folder, &tagsJSON, &favorite, &createdAt, &updatedAt, &deletedAt,
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
