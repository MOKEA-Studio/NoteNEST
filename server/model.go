package main

import (
	"encoding/json"
	"strings"
	"time"
)

const emptyDocument = `{"type":"doc","content":[{"type":"paragraph"}]}`

type Page struct {
	ID        string          `json:"id"`
	Title     string          `json:"title"`
	Content   string          `json:"content"`
	Blocks    json.RawMessage `json:"blocks"`
	Icon      string          `json:"icon"`
	CoverURL  string          `json:"coverUrl"`
	Folder    string          `json:"folder"`
	Tags      []string        `json:"tags"`
	CreatedAt time.Time       `json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
	DeletedAt *time.Time      `json:"deletedAt,omitempty"`
	Favorite  bool            `json:"favorite"`
}

type pageInput struct {
	Title    *string          `json:"title"`
	Content  *string          `json:"content"`
	Blocks   *json.RawMessage `json:"blocks"`
	Icon     *string          `json:"icon"`
	CoverURL *string          `json:"coverUrl"`
	Folder   *string          `json:"folder"`
	Tags     *[]string        `json:"tags"`
	Favorite *bool            `json:"favorite"`
}

type FontAsset struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

type AppSettings struct {
	FontFamily   string            `json:"fontFamily"`
	FontSize     int               `json:"fontSize"`
	EditorWidth  string            `json:"editorWidth"`
	Theme        string            `json:"theme"`
	LineSpacing  string            `json:"lineSpacing"`
	ReduceMotion bool              `json:"reduceMotion"`
	CustomFonts  []FontAsset       `json:"customFonts"`
	TagColors    map[string]string `json:"tagColors"`
}

func defaultSettings() AppSettings {
	return AppSettings{
		FontFamily:  "system",
		FontSize:    16,
		EditorWidth: "standard",
		Theme:       "system",
		LineSpacing: "comfortable",
		CustomFonts: make([]FontAsset, 0),
		TagColors:   make(map[string]string),
	}
}

var supportedTagTones = map[string]struct{}{
	"green":  {},
	"gold":   {},
	"coral":  {},
	"cyan":   {},
	"olive":  {},
	"indigo": {},
}

func sanitizeTagColors(colors map[string]string) map[string]string {
	sanitized := make(map[string]string, len(colors))
	for tag, tone := range colors {
		name := strings.TrimSpace(tag)
		if name == "" {
			continue
		}
		if _, supported := supportedTagTones[tone]; !supported {
			continue
		}
		sanitized[name] = tone
	}
	return sanitized
}

type PageVersion struct {
	ID       int64           `json:"id"`
	PageID   string          `json:"pageId"`
	Title    string          `json:"title"`
	Content  string          `json:"content"`
	Blocks   json.RawMessage `json:"blocks"`
	Icon     string          `json:"icon"`
	CoverURL string          `json:"coverUrl"`
	Folder   string          `json:"folder"`
	Tags     []string        `json:"tags"`
	Favorite bool            `json:"favorite"`
	SavedAt  time.Time       `json:"savedAt"`
}

type BackupInfo struct {
	Name      string    `json:"name"`
	Path      string    `json:"path"`
	Size      int64     `json:"size"`
	CreatedAt time.Time `json:"createdAt"`
}

type StorageInfo struct {
	DatabasePath string       `json:"databasePath"`
	NotesBytes   int64        `json:"notesBytes"`
	UploadsBytes int64        `json:"uploadsBytes"`
	BackupsBytes int64        `json:"backupsBytes"`
	TotalBytes   int64        `json:"totalBytes"`
	Backups      []BackupInfo `json:"backups"`
}
