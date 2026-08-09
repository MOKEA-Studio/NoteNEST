package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

var allowedExtensions = map[string]map[string]bool{
	"image": {
		".png": true, ".jpg": true, ".jpeg": true, ".gif": true,
		".webp": true, ".avif": true,
	},
	"font": {
		".ttf": true, ".otf": true, ".woff": true, ".woff2": true,
	},
}

func (a *api) uploadAsset(w http.ResponseWriter, r *http.Request) {
	kind := r.URL.Query().Get("kind")
	allowed, ok := allowedExtensions[kind]
	if !ok {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "지원하지 않는 업로드 종류입니다."})
		return
	}

	const maxUploadSize = 20 << 20
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "파일은 20MB 이하만 업로드할 수 있습니다."})
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "업로드할 파일을 선택해주세요."})
		return
	}
	defer file.Close()

	extension := strings.ToLower(filepath.Ext(header.Filename))
	if !allowed[extension] {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "지원하지 않는 파일 형식입니다."})
		return
	}
	id, err := newPageID()
	if err != nil {
		writeError(w, err)
		return
	}
	filename := strings.Replace(id, "page_", kind+"_", 1) + extension
	target := filepath.Join(a.uploadDir, filename)
	destination, err := os.OpenFile(target, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		writeError(w, err)
		return
	}
	defer destination.Close()
	if _, err := io.Copy(destination, file); err != nil {
		os.Remove(target)
		writeError(w, err)
		return
	}

	name := strings.TrimSpace(strings.TrimSuffix(filepath.Base(header.Filename), extension))
	if name == "" {
		name = "업로드 파일"
	}
	writeJSON(w, http.StatusCreated, map[string]string{
		"name": name,
		"url":  fmt.Sprintf("http://127.0.0.1:8787/uploads/%s", filename),
	})
}

func (a *api) serveUpload(w http.ResponseWriter, r *http.Request) {
	name := filepath.Base(r.PathValue("name"))
	if name == "." || name == "" || name != r.PathValue("name") {
		http.NotFound(w, r)
		return
	}
	http.ServeFile(w, r, filepath.Join(a.uploadDir, name))
}
