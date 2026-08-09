# NoteNest UI Concept Pack

Generated on 2026-08-09 with the built-in OpenAI image generation tool. These
images are product-design references, not pixel-perfect implementation specs.

## Visual Direction

- Quiet, compact productivity UI rather than a marketing-style layout
- Desktop palette based on the current app: `#f8f8f5`, `#eef0eb`, `#252823`,
  `#73796f`, `#dfe3dc`, and accent `#2f6f67`
- Thin separators, familiar line icons, and corner radii of 8px or less
- Local-first storage status and recovery actions remain visible when relevant
- Korean labels are representative product copy and should be reviewed before
  implementation

## Screen Index

| File | Screen | Suggested phase |
| --- | --- | --- |
| [01-main-editor.png](01-main-editor.png) | Main rich-text editor with cover | Current foundation |
| [02-empty-workspace.png](02-empty-workspace.png) | First-run and empty workspace | P0 |
| [03-global-search.png](03-global-search.png) | Full-text search, filters, highlights | P0 |
| [04-all-notes-and-folders.png](04-all-notes-and-folders.png) | All notes, folder tree, inspector | P1 |
| [05-tags.png](05-tags.png) | Tag overview and management | P1 |
| [06-template-gallery.png](06-template-gallery.png) | New-page templates and preview | P1 |
| [07-trash-and-delete-confirmation.png](07-trash-and-delete-confirmation.png) | Trash, restore, permanent delete | P0 |
| [08-version-history.png](08-version-history.png) | Autosave history, diff, restore | P0 |
| [09-import-export.png](09-import-export.png) | Markdown, PDF, and JSON transfer | P0 |
| [10-editor-appearance-settings.png](10-editor-appearance-settings.png) | Theme and editor preferences | P0 |
| [11-data-storage-and-backup.png](11-data-storage-and-backup.png) | Local storage and backups | P0 |
| [12-sync-settings.png](12-sync-settings.png) | Optional encrypted device sync | Future |
| [13-offline-save-recovery.png](13-offline-save-recovery.png) | Offline queue and save recovery | P0 |
| [14-dark-mode-editor.png](14-dark-mode-editor.png) | Dark editor variant | P1 |
| [15-mobile-editor.png](15-mobile-editor.png) | Mobile editor and bottom tools | Mobile phase |
| [16-mobile-navigation.png](16-mobile-navigation.png) | Mobile navigation drawer | Mobile phase |
| [17-mobile-search.png](17-mobile-search.png) | Mobile full-text search | Mobile phase |
| [18-mobile-settings.png](18-mobile-settings.png) | Mobile settings and backup status | Mobile phase |

## Prompt Set

All images used this shared prompt direction:

> High-fidelity UI mockup for NoteNest, a Korean local-first personal notes app.
> Show only the full application screenshot, with no device presentation frame
> on desktop. Use a quiet, precise, utilitarian productivity style; compact
> Korean typography; neutral warm-gray surfaces; teal actions; thin dividers;
> Lucide-like line icons; no gradients; no decorative cards; no watermark.

Screen-specific prompt additions:

1. Main editor: 286px sidebar, rich-text toolbar, forest cover, page metadata,
   headings, body text, and tasks.
2. Empty workspace: useful first-run state with new-page and template actions.
3. Search: query filters, result count, highlighted snippets, date popover.
4. Library: folder tree, dense note table, sorting, and selected-note inspector.
5. Tags: tag counts, restrained swatches, inline rename, selected-tag results.
6. Templates: category tabs, eight template previews, and live preview panel.
7. Trash: retention dates, multi-select restore, and permanent-delete dialog.
8. Version history: docked history panel, subtle text diff, restore action.
9. Import/export: scope, Markdown/PDF/JSON formats, options, recent completion.
10. Appearance: theme previews, font, size, width, spacing, motion, live preview.
11. Storage: data path, usage breakdown, scheduled encrypted backups, restore.
12. Sync: local-first status, connected devices, encryption, conflict behavior.
13. Offline recovery: safe local status, queued changes, retry, recovery copy.
14. Dark mode: charcoal neutral palette with accessible teal and gold accents.
15. Mobile editor: portrait layout, large touch targets, stable bottom toolbar.
16. Mobile navigation: full-height drawer, folders, recents, storage status.
17. Mobile search: portrait filters and divided highlighted result list.
18. Mobile settings: full-width rows, current values, backup and sync status.

## Implementation Reading Order

Start with screens 13, 03, 08, 11, and 09. Together they define the product's
most important promise: notes remain safe, recoverable, searchable, and portable.
Then use screens 04 through 07 for organization, followed by appearance, dark
mode, optional sync, and mobile adaptations.
