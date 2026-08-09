package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

func (s *store) createBackup(ctx context.Context) (BackupInfo, error) {
	dir := filepath.Join(filepath.Dir(s.path), "backups")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return BackupInfo{}, err
	}
	name := "notenest-" + time.Now().UTC().Format("20060102-150405.000000000") + ".db"
	path := filepath.Join(dir, name)
	escaped := strings.ReplaceAll(path, "'", "''")
	if _, err := s.db.ExecContext(ctx, fmt.Sprintf("VACUUM INTO '%s'", escaped)); err != nil {
		return BackupInfo{}, err
	}
	return backupInfo(path)
}

func (s *store) storageInfo(uploadDir string) (StorageInfo, error) {
	notesBytes := fileSize(s.path) + fileSize(s.path+"-wal") + fileSize(s.path+"-shm")
	uploadsBytes, err := directorySize(uploadDir)
	if err != nil {
		return StorageInfo{}, err
	}
	backupDir := filepath.Join(filepath.Dir(s.path), "backups")
	backups, err := listBackups(backupDir)
	if err != nil {
		return StorageInfo{}, err
	}
	var backupsBytes int64
	for _, backup := range backups {
		backupsBytes += backup.Size
	}
	return StorageInfo{
		DatabasePath: s.path,
		NotesBytes:   notesBytes,
		UploadsBytes: uploadsBytes,
		BackupsBytes: backupsBytes,
		TotalBytes:   notesBytes + uploadsBytes + backupsBytes,
		Backups:      backups,
	}, nil
}

func listBackups(dir string) ([]BackupInfo, error) {
	entries, err := os.ReadDir(dir)
	if os.IsNotExist(err) {
		return make([]BackupInfo, 0), nil
	}
	if err != nil {
		return nil, err
	}
	backups := make([]BackupInfo, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".db" {
			continue
		}
		info, err := backupInfo(filepath.Join(dir, entry.Name()))
		if err != nil {
			return nil, err
		}
		backups = append(backups, info)
	}
	sort.Slice(backups, func(i, j int) bool { return backups[i].CreatedAt.After(backups[j].CreatedAt) })
	return backups, nil
}

func backupInfo(path string) (BackupInfo, error) {
	info, err := os.Stat(path)
	if err != nil {
		return BackupInfo{}, err
	}
	return BackupInfo{Name: info.Name(), Path: path, Size: info.Size(), CreatedAt: info.ModTime()}, nil
}

func fileSize(path string) int64 {
	info, err := os.Stat(path)
	if err != nil {
		return 0
	}
	return info.Size()
}

func directorySize(path string) (int64, error) {
	var total int64
	err := filepath.Walk(path, func(_ string, info os.FileInfo, err error) error {
		if os.IsNotExist(err) {
			return nil
		}
		if err != nil {
			return err
		}
		if !info.IsDir() {
			total += info.Size()
		}
		return nil
	})
	if os.IsNotExist(err) {
		return 0, nil
	}
	return total, err
}
