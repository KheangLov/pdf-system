# Wing Sign

Frontend-only, offline-first PDF preparation and signing suite — a modern, premium take on the Odoo Sign UX.

- 100% browser-side. No backend, no auth, no API. Documents, templates, and signatures are persisted in IndexedDB.
- Vue 3 + TypeScript + Vite + Pinia + Vuetify 3.
- pdf.js for rendering, pdf-lib for export, signature_pad for drawing, interact.js for drag/resize.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production bundle
npm run preview      # preview built output
npm run type-check   # vue-tsc strict type check
```

## Stack

| Layer              | Choice                                                  |
| ------------------ | ------------------------------------------------------- |
| Framework          | Vue 3 (`<script setup lang="ts">`, Composition API)     |
| Build              | Vite 6, vue-tsc                                          |
| UI                 | Vuetify 3 (MDI icons), custom premium theme & SCSS      |
| State              | Pinia (`document`, `editor`, `history`, `signature`, `template`, `ui`) |
| Routing            | Vue Router 4 with lazy-loaded views                     |
| PDF rendering      | `pdfjs-dist` (worker-based)                              |
| PDF authoring      | `pdf-lib`                                                |
| Drag / resize      | `interact.js`                                            |
| Signature drawing  | `signature_pad` + `<canvas>` typed signatures           |
| Persistence        | `idb` over IndexedDB, with `localforage` fallback ready |
| Utilities          | VueUse, lodash-es, dayjs, file-saver, nanoid, uuid       |

## Folder structure

```
src/
├── App.vue
├── main.ts
├── env.d.ts
├── components/
│   ├── editor/           Field overlays, sidebars, canvas, toolbar
│   ├── feedback/         Toasts
│   ├── layout/           App shell (sidebar + appbar)
│   ├── pdf/              Virtualised pdf.js page renderer
│   ├── shared/           Drop zones, cards
│   ├── signature/        Signature modal + canvas pad
│   └── signing/          Signing-mode field renderer
├── composables/          useFieldInteractions, useAutoSave
├── constants/            Field catalogue, signature fonts
├── plugins/              Vuetify setup with custom premium theme
├── router/               Lazy routes incl. fullscreen editor & signing
├── services/
│   ├── pdf/              loader, exporter, worker bootstrap
│   └── storage/          IndexedDB repositories
├── stores/               Pinia stores
├── styles/               Global SCSS (premium theme, animations)
├── types/                Strict TypeScript types
└── views/                Dashboard, Documents, Templates, Signatures, Editor, Signing, Settings
```

## Core workflows

### 1. Upload → prepare
1. Drag a PDF into the dashboard or `/documents` drop zone.
2. The document is rendered with pdf.js in a Web Worker.
3. Drag fields from the left tool palette onto any page.
4. Resize, snap, duplicate, lock, or configure styling/validation in the right inspector.
5. Auto-save persists to IndexedDB; manual `Ctrl+S` available.
6. Save as template for reuse.

### 2. Sign
1. Click **Sign now** in the editor (or **Sign** on a document card).
2. Fill text, dates, checkboxes, and selections inline.
3. Click any signature/initial field — the **Adopt your signature** modal opens (Draw / Type / Upload + Saved).
4. The progress pill in the toolbar tracks required fields completed.
5. Click **Finish & download** to flatten the signed PDF (pdf-lib) and save to disk.

### 3. Templates
- Save any prepared document as a template (with category and description).
- Instantiate to create a fresh document with all fields pre-placed.

## Field types

`signature`, `initial`, `text`, `multiline`, `checkbox`, `selection`, `date`, `name`, `email`, `phone`, `company`, `title`.

Each supports drag/resize, required/locked toggles, placeholder, default value, validation (regex/min/max length), and styling (font, color, alignment, border).

## Keyboard shortcuts

| Action           | Shortcut                  |
| ---------------- | ------------------------- |
| Save             | `Ctrl/Cmd + S`            |
| Undo             | `Ctrl/Cmd + Z`            |
| Redo             | `Ctrl/Cmd + Shift + Z`    |
| Duplicate field  | `Ctrl/Cmd + D`            |
| Delete field     | `Delete` / `Backspace`    |
| Deselect         | `Esc`                     |
| Zoom in/out/reset| `Ctrl/Cmd + + / - / 0`    |

## Privacy

Everything stays on this device. The app does not make any network requests with your documents. Clearing site data wipes all stored documents, templates, and signatures.
