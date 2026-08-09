package main

import (
	"encoding/json"
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
	FontFamily   string      `json:"fontFamily"`
	FontSize     int         `json:"fontSize"`
	EditorWidth  string      `json:"editorWidth"`
	Theme        string      `json:"theme"`
	LineSpacing  string      `json:"lineSpacing"`
	ReduceMotion bool        `json:"reduceMotion"`
	CustomFonts  []FontAsset `json:"customFonts"`
}

func defaultSettings() AppSettings {
	return AppSettings{
		FontFamily:  "system",
		FontSize:    16,
		EditorWidth: "standard",
		Theme:       "system",
		LineSpacing: "comfortable",
		CustomFonts: make([]FontAsset, 0),
	}
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
