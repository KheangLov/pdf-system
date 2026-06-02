<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEditorStore, useHistoryStore, useUIStore } from '@/stores'
import dayjs from 'dayjs'

const router = useRouter()
const editor = useEditorStore()
const history = useHistoryStore()
const ui = useUIStore()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'saveTemplate'): void
  (e: 'preview'): void
  (e: 'startSigning'): void
}>()

const savedLabel = computed(() => {
  if (editor.isSaving) return 'Saving…'
  if (!editor.lastSavedAt) return 'Not saved'
  return `Saved ${dayjs(editor.lastSavedAt).format('HH:mm')}`
})

const zoomPct = computed(() => Math.round(editor.zoom * 100))

function undo() {
  const snap = history.undo()
  if (snap) editor.restoreFields(snap)
}
function redo() {
  const snap = history.redo()
  if (snap) editor.restoreFields(snap)
}
</script>

<template>
  <header class="editor-toolbar ws-glass">
    <!-- Left: back + document meta -->
    <div class="toolbar-section">
      <button
        class="tb-icon-btn"
        @click="router.push('/documents')"
        title="Back to documents"
        aria-label="Back to documents"
      >
        <v-icon icon="mdi-arrow-left" size="18" />
      </button>

      <div class="doc-meta">
        <div class="doc-title">{{ editor.document?.name ?? 'Untitled' }}</div>
        <div class="doc-status">
          <span class="status-dot" :class="{ saving: editor.isSaving }" />
          <span>{{ savedLabel }}</span>
        </div>
      </div>
    </div>

    <!-- Center: history, zoom, view toggles -->
    <div class="toolbar-section center">
      <!-- History group -->
      <div class="tb-group">
        <button
          class="tb-icon-btn"
          :disabled="!history.canUndo"
          @click="undo"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <v-icon icon="mdi-undo-variant" size="18" />
        </button>
        <span class="tb-divider" />
        <button
          class="tb-icon-btn"
          :disabled="!history.canRedo"
          @click="redo"
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          <v-icon icon="mdi-redo-variant" size="18" />
        </button>
      </div>

      <!-- Zoom group -->
      <div class="tb-group">
        <button
          class="tb-icon-btn"
          :disabled="zoomPct <= 40"
          @click="editor.zoomOut()"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <v-icon icon="mdi-minus" size="16" />
        </button>
        <span class="tb-divider" />
        <button
          class="tb-zoom-label"
          @click="editor.resetZoom()"
          title="Reset zoom (Ctrl+0)"
        >
          {{ zoomPct }}%
        </button>
        <span class="tb-divider" />
        <button
          class="tb-icon-btn"
          :disabled="zoomPct >= 300"
          @click="editor.zoomIn()"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <v-icon icon="mdi-plus" size="16" />
        </button>
      </div>

      <!-- View options -->
      <div class="tb-group">
        <button
          class="tb-icon-btn"
          :class="{ active: ui.preferences.showGrid }"
          @click="ui.updatePreferences({ showGrid: !ui.preferences.showGrid })"
          title="Toggle grid"
          aria-label="Toggle grid"
        >
          <v-icon :icon="ui.preferences.showGrid ? 'mdi-grid' : 'mdi-grid-off'" size="17" />
        </button>
        <span class="tb-divider" />
        <button
          class="tb-icon-btn"
          :class="{ active: ui.preferences.snapToGrid }"
          @click="ui.updatePreferences({ snapToGrid: !ui.preferences.snapToGrid })"
          title="Toggle snap"
          aria-label="Toggle snap"
        >
          <v-icon :icon="ui.preferences.snapToGrid ? 'mdi-magnet' : 'mdi-magnet-off'" size="17" />
        </button>
        <span class="tb-divider" />
        <button
          class="tb-icon-btn"
          :class="{ active: editor.mode === 'preview' }"
          @click="emit('preview')"
          :title="editor.mode === 'preview' ? 'Exit preview' : 'Preview signing'"
          aria-label="Toggle preview"
        >
          <v-icon :icon="editor.mode === 'preview' ? 'mdi-eye' : 'mdi-eye-outline'" size="17" />
        </button>
      </div>
    </div>

    <!-- Right: theme, save, sign -->
    <div class="toolbar-section end">
      <button
        class="tb-icon-btn"
        @click="ui.toggleTheme()"
        :title="ui.preferences.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
        aria-label="Toggle theme"
      >
        <v-icon
          :icon="ui.preferences.theme === 'dark' ? 'mdi-white-balance-sunny' : 'mdi-weather-night'"
          size="17"
        />
      </button>

      <button
        class="tb-text-btn"
        @click="emit('saveTemplate')"
        title="Save as template"
      >
        <v-icon icon="mdi-bookmark-plus-outline" size="16" />
        <span>Template</span>
      </button>

      <button
        class="tb-text-btn primary"
        @click="emit('save')"
        :disabled="editor.isSaving"
        title="Save (Ctrl+S)"
      >
        <v-icon
          :icon="editor.isSaving ? 'mdi-loading' : 'mdi-content-save-outline'"
          size="16"
          :class="{ 'mdi-spin': editor.isSaving }"
        />
        <span>Save</span>
      </button>

      <button
        class="tb-text-btn cta"
        @click="emit('startSigning')"
        title="Open signing mode"
      >
        <v-icon icon="mdi-draw-pen" size="16" />
        <span>Sign now</span>
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.editor-toolbar {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 14px;
  gap: 16px;
  border-bottom: 1px solid rgb(var(--v-theme-border));
  z-index: 20;
}

.toolbar-section { display: flex; align-items: center; gap: 8px; min-width: 0; }
.toolbar-section.center { flex: 1; justify-content: center; }

/* ---------- Document meta ---------- */
.doc-meta { line-height: 1.25; min-width: 0; padding-left: 2px; }
.doc-title {
  font-weight: 600;
  font-size: 13.5px;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
  color: rgb(var(--v-theme-on-surface));
}
.doc-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-variant-numeric: tabular-nums;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(var(--v-theme-success));
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.16);
  &.saving {
    background: rgb(var(--v-theme-warning));
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.18);
    animation: pulse 1.2s ease-in-out infinite;
  }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ---------- Grouped pill (history, zoom, view options) ---------- */
.tb-group {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 2px;
  background: rgb(var(--v-theme-surface-variant));
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 10px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}
[data-theme='dark'] .tb-group {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.tb-divider {
  width: 1px;
  height: 18px;
  background: rgb(var(--v-theme-border));
  margin: 0 1px;
  flex-shrink: 0;
}

/* ---------- Buttons ---------- */
.tb-icon-btn,
.tb-text-btn,
.tb-zoom-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 30px;
  padding: 0 8px;
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: -0.005em;
  border-radius: 7px;
  cursor: pointer;
  transition:
    background 0.12s var(--ws-easing),
    color 0.12s var(--ws-easing),
    transform 0.08s var(--ws-easing),
    box-shadow 0.12s var(--ws-easing);
  user-select: none;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.10);
    color: rgb(var(--v-theme-primary));
  }
  &:active:not(:disabled) { transform: scale(0.96); }
  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  &.active {
    background: rgba(99, 102, 241, 0.14);
    color: rgb(var(--v-theme-primary));
  }
}

.tb-icon-btn {
  width: 30px;
  padding: 0;
}

.tb-zoom-label {
  min-width: 52px;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

/* ---------- Right-side buttons ---------- */
.tb-text-btn {
  height: 34px;
  padding: 0 12px;
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 9px;
  background: rgb(var(--v-theme-surface));
  &:hover:not(:disabled) {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(99, 102, 241, 0.06);
  }
}

.tb-text-btn.primary {
  border-color: rgba(99, 102, 241, 0.30);
  background: rgba(99, 102, 241, 0.10);
  color: rgb(var(--v-theme-primary));
  &:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.18);
    border-color: rgba(99, 102, 241, 0.50);
  }
}

.tb-text-btn.cta {
  height: 34px;
  padding: 0 14px;
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
  color: #fff;
  border: 1px solid transparent;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.20) inset,
    0 4px 14px rgba(99, 102, 241, 0.30);
  font-weight: 600;
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%);
    color: #fff;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.24) inset,
      0 6px 18px rgba(99, 102, 241, 0.42);
    transform: translateY(-1px);
  }
  &:active:not(:disabled) { transform: translateY(0) scale(0.98); }
}

/* ---------- Responsive ---------- */
@media (max-width: 1240px) {
  .tb-text-btn span { display: none; }
  .tb-text-btn { padding: 0 10px; }
  .tb-text-btn.cta { padding: 0 12px; }
}
@media (max-width: 980px) {
  .doc-title { max-width: 140px; }
  .toolbar-section.center .tb-group:nth-child(3) { display: none; }
}
@media (max-width: 760px) {
  .toolbar-section.center .tb-group:nth-child(1) { display: none; }
}
</style>
