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
	FontFamily  string      `json:"fontFamily"`
	FontSize    int         `json:"fontSize"`
	EditorWidth string      `json:"editorWidth"`
	CustomFonts []FontAsset `json:"customFonts"`
}

func defaultSettings() AppSettings {
	return AppSettings{
		FontFamily:  "system",
		FontSize:    16,
		EditorWidth: "standard",
		CustomFonts: make([]FontAsset, 0),
	}
}
