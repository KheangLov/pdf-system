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
  if (!editor.lastSavedAt) return 'Not saved yet'
  return `Saved ${dayjs(editor.lastSavedAt).format('HH:mm:ss')}`
})

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
    <div class="toolbar-section">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        size="small"
        @click="router.push('/documents')"
        title="Back to documents"
      />
      <div class="doc-meta">
        <div class="doc-title">{{ editor.document?.name ?? 'Untitled' }}</div>
        <div class="doc-status">
          <span class="status-dot" :class="{ saving: editor.isSaving }" />
          {{ savedLabel }}
        </div>
      </div>
    </div>

    <div class="toolbar-section center">
      <v-btn-toggle density="compact" variant="text" divided rounded="lg">
        <v-btn
          icon="mdi-undo"
          size="small"
          :disabled="!history.canUndo"
          @click="undo"
          title="Undo (Ctrl+Z)"
        />
        <v-btn
          icon="mdi-redo"
          size="small"
          :disabled="!history.canRedo"
          @click="redo"
          title="Redo (Ctrl+Shift+Z)"
        />
      </v-btn-toggle>

      <v-divider vertical class="mx-2" />

      <v-btn-toggle density="compact" variant="text" divided rounded="lg">
        <v-btn icon="mdi-magnify-minus-outline" size="small" @click="editor.zoomOut()" />
        <v-btn variant="text" size="small" class="zoom-label" @click="editor.resetZoom()">
          {{ Math.round(editor.zoom * 100) }}%
        </v-btn>
        <v-btn icon="mdi-magnify-plus-outline" size="small" @click="editor.zoomIn()" />
      </v-btn-toggle>

      <v-divider vertical class="mx-2" />

      <v-btn
        variant="text"
        size="small"
        :prepend-icon="ui.preferences.showGrid ? 'mdi-grid' : 'mdi-grid-off'"
        @click="ui.updatePreferences({ showGrid: !ui.preferences.showGrid })"
        title="Toggle grid"
      >Grid</v-btn>

      <v-btn
        variant="text"
        size="small"
        :prepend-icon="ui.preferences.snapToGrid ? 'mdi-magnet' : 'mdi-magnet-off'"
        @click="ui.updatePreferences({ snapToGrid: !ui.preferences.snapToGrid })"
        title="Toggle snap"
      >Snap</v-btn>
    </div>

    <div class="toolbar-section end">
      <v-btn
        variant="text"
        size="small"
        :prepend-icon="ui.preferences.theme === 'dark' ? 'mdi-white-balance-sunny' : 'mdi-weather-night'"
        @click="ui.toggleTheme()"
      >Theme</v-btn>

      <v-btn
        variant="text"
        size="small"
        prepend-icon="mdi-eye-outline"
        @click="emit('preview')"
      >Preview</v-btn>

      <v-btn
        variant="text"
        size="small"
        prepend-icon="mdi-content-save-outline"
        @click="emit('saveTemplate')"
      >Save template</v-btn>

      <v-btn
        variant="tonal"
        size="small"
        color="primary"
        prepend-icon="mdi-content-save"
        @click="emit('save')"
        :loading="editor.isSaving"
      >Save</v-btn>

      <v-btn
        variant="flat"
        size="small"
        color="primary"
        prepend-icon="mdi-arrow-right"
        append-icon="mdi-draw-pen"
        @click="emit('startSigning')"
      >Sign now</v-btn>
    </div>
  </header>
</template>

<style scoped lang="scss">
.editor-toolbar {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 12px;
  gap: 12px;
  border-bottom: 1px solid rgb(var(--v-theme-border));
  z-index: 20;
}
.toolbar-section { display: flex; align-items: center; gap: 4px; }
.toolbar-section.center { flex: 1; justify-content: center; }
.toolbar-section.end { gap: 6px; }

.doc-meta { line-height: 1.2; padding-left: 4px; min-width: 0; }
.doc-title {
  font-weight: 600;
  font-size: 13.5px;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}
.doc-status {
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
  display: flex;
  align-items: center;
  gap: 6px;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(var(--v-theme-success));
  &.saving { background: rgb(var(--v-theme-warning)); animation: pulse 1s infinite; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.zoom-label { min-width: 56px; font-variant-numeric: tabular-nums; }

@media (max-width: 1100px) {
  .toolbar-section.center { display: none; }
}
</style>
