package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type api struct {
	store     *store
	uploadDir string
}

func main() {
	databasePath, err := resolveDatabasePath()
	if err != nil {
		log.Fatal(err)
	}
	dataStore, err := openStore(databasePath)
	if err != nil {
		log.Fatal(err)
	}
	defer dataStore.close()
	uploadDir := filepath.Join(filepath.Dir(databasePath), "uploads")
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		log.Fatal(err)
	}

	server := &http.Server{
		Addr:              "127.0.0.1:8787",
		Handler:           (&api{store: dataStore, uploadDir: uploadDir}).routes(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("NoteNest API listening on http://%s", server.Addr)
	if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}

func resolveDatabasePath() (string, error) {
	if path := os.Getenv("NOTENEST_DB_PATH"); path != "" {
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			return "", err
		}
		return path, nil
	}
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(configDir, "NoteNest")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return filepath.Join(dir, "notenest.db"), nil
}

func (a *api) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /api/pages", a.listPages)
	mux.HandleFunc("POST /api/pages", a.createPage)
	mux.HandleFunc("GET /api/pages/{id}", a.getPage)
	mux.HandleFunc("PUT /api/pages/{id}", a.updatePage)
	mux.HandleFunc("DELETE /api/pages/{id}", a.deletePage)
	mux.HandleFunc("GET /api/pages/{id}/versions", a.listVersions)
	mux.HandleFunc("POST /api/pages/{id}/versions/{versionId}/restore", a.restoreVersion)
	mux.HandleFunc("GET /api/search", a.searchPages)
	mux.HandleFunc("GET /api/trash", a.listTrash)
	mux.HandleFunc("DELETE /api/trash", a.emptyTrash)
	mux.HandleFunc("POST /api/trash/{id}/restore", a.restoreTrashPage)
	mux.HandleFunc("DELETE /api/trash/{id}", a.permanentlyDeletePage)
	mux.HandleFunc("GET /api/settings", a.getSettings)
	mux.HandleFunc("PUT /api/settings", a.updateSettings)
	mux.HandleFunc("GET /api/storage", a.getStorage)
	mux.HandleFunc("POST /api/backups", a.createBackup)
	mux.HandleFunc("POST /api/uploads", a.uploadAsset)
	mux.HandleFunc("GET /uploads/{name}", a.serveUpload)
	return cors(mux)
}

func (a *api) listPages(w http.ResponseWriter, r *http.Request) {
	pages, err := a.store.listPages(r.Context(), "")
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, pages)
}

func (a *api) searchPages(w http.ResponseWriter, r *http.Request) {
	pages, err := a.store.listPages(r.Context(), strings.TrimSpace(r.URL.Query().Get("q")))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, pages)
}

func (a *api) createPage(w http.ResponseWriter, r *http.Request) {
	page, err := a.store.createPage(r.Context())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, page)
}

func (a *api) getPage(w http.ResponseWriter, r *http.Request) {
	page, err := a.store.getPage(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (a *api) updatePage(w http.ResponseWriter, r *http.Request) {
	var input pageInput
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 5<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "올바른 페이지 데이터를 입력해주세요."})
		return
	}
	page, err := a.store.updatePage(r.Context(), r.PathValue("id"), input)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (a *api) deletePage(w http.ResponseWriter, r *http.Request) {
	if err := a.store.deletePage(r.Context(), r.PathValue("id")); err != nil {
		writeError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (a *api) listTrash(w http.ResponseWriter, r *http.Request) {
	pages, err := a.store.listTrash(r.Context(), strings.TrimSpace(r.URL.Query().Get("q")))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, pages)
}

func (a *api) restoreTrashPage(w http.ResponseWriter, r *http.Request) {
	page, err := a.store.restorePage(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (a *api) permanentlyDeletePage(w http.ResponseWriter, r *http.Request) {
	if err := a.store.permanentlyDeletePage(r.Context(), r.PathValue("id")); err != nil {
		writeError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (a *api) emptyTrash(w http.ResponseWriter, r *http.Request) {
	if err := a.store.emptyTrash(r.Context()); err != nil {
		writeError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (a *api) listVersions(w http.ResponseWriter, r *http.Request) {
	versions, err := a.store.listVersions(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, versions)
}

func (a *api) restoreVersion(w http.ResponseWriter, r *http.Request) {
	versionID, err := strconv.ParseInt(r.PathValue("versionId"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "올바른 버전을 선택해주세요."})
		return
	}
	page, err := a.store.restoreVersion(r.Context(), r.PathValue("id"), versionID)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (a *api) getSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := a.store.getSettings(r.Context())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, settings)
}

func (a *api) updateSettings(w http.ResponseWriter, r *http.Request) {
	var settings AppSettings
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&settings); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "올바른 설정 데이터를 입력해주세요."})
		return
	}
	if settings.FontSize < 13 || settings.FontSize > 24 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "글자 크기는 13px에서 24px 사이여야 합니다."})
		return
	}
	if settings.FontFamily == "" {
		settings.FontFamily = "system"
	}
	if settings.EditorWidth != "standard" && settings.EditorWidth != "wide" && settings.EditorWidth != "compact" {
		settings.EditorWidth = "standard"
	}
	if settings.Theme != "light" && settings.Theme != "dark" && settings.Theme != "system" {
		settings.Theme = "system"
	}
	if settings.LineSpacing != "compact" && settings.LineSpacing != "comfortable" && settings.LineSpacing != "relaxed" {
		settings.LineSpacing = "comfortable"
	}
	if settings.CustomFonts == nil {
		settings.CustomFonts = make([]FontAsset, 0)
	}
	saved, err := a.store.saveSettings(r.Context(), settings)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, saved)
}

func (a *api) getStorage(w http.ResponseWriter, _ *http.Request) {
	info, err := a.store.storageInfo(a.uploadDir)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, info)
}

func (a *api) createBackup(w http.ResponseWriter, r *http.Request) {
	backup, err := a.store.createBackup(r.Context())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, backup)
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeError(w http.ResponseWriter, err error) {
	if errors.Is(err, errNotFound) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": err.Error()})
		return
	}
	log.Printf("api error: %v", err)
	writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "서버 오류가 발생했습니다."})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Print(fmt.Errorf("encode response: %w", err))
	}
}
