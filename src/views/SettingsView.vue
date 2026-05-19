<script setup lang="ts">
import { useUIStore, useDocumentStore, useTemplateStore, useSignatureStore } from '@/stores'

const ui = useUIStore()
const docs = useDocumentStore()
const templates = useTemplateStore()
const sigs = useSignatureStore()

const themes = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
] as const

async function clearAllData() {
  if (!confirm('This will erase ALL documents, templates, and signatures. Continue?')) return
  for (const d of [...docs.documents]) await docs.remove(d.id)
  for (const t of [...templates.templates]) await templates.remove(t.id)
  for (const s of [...sigs.signatures, ...sigs.initials]) await sigs.remove(s.id)
  ui.pushToast('All local data cleared', 'info')
}
</script>

<template>
  <div class="settings">
    <h1 class="page-title">Settings</h1>
    <p class="page-sub">Personalise your Wing Sign workspace</p>

    <section class="setting-card">
      <h2>Appearance</h2>
      <div class="row">
        <div class="row-info">
          <div class="row-title">Theme</div>
          <div class="row-sub">Switch between light and dark mode</div>
        </div>
        <v-btn-toggle
          :model-value="ui.preferences.theme"
          mandatory
          color="primary"
          variant="outlined"
          density="comfortable"
          @update:model-value="ui.updatePreferences({ theme: $event })"
        >
          <v-btn v-for="t in themes" :key="t.value" :value="t.value" size="small">{{ t.label }}</v-btn>
        </v-btn-toggle>
      </div>

      <div class="row">
        <div class="row-info">
          <div class="row-title">Density</div>
          <div class="row-sub">Comfortable for desktop, compact for tablets</div>
        </div>
        <v-btn-toggle
          :model-value="ui.preferences.density"
          mandatory
          color="primary"
          variant="outlined"
          density="comfortable"
          @update:model-value="ui.updatePreferences({ density: $event })"
        >
          <v-btn value="comfortable" size="small">Comfortable</v-btn>
          <v-btn value="compact" size="small">Compact</v-btn>
        </v-btn-toggle>
      </div>
    </section>

    <section class="setting-card">
      <h2>Editor</h2>
      <div class="row">
        <div class="row-info">
          <div class="row-title">Show grid</div>
          <div class="row-sub">Visual grid overlay on the document canvas</div>
        </div>
        <v-switch
          :model-value="ui.preferences.showGrid"
          color="primary"
          inset hide-details
          @update:model-value="ui.updatePreferences({ showGrid: !!$event })"
        />
      </div>
      <div class="row">
        <div class="row-info">
          <div class="row-title">Snap to grid</div>
          <div class="row-sub">Align fields to the nearest grid point</div>
        </div>
        <v-switch
          :model-value="ui.preferences.snapToGrid"
          color="primary"
          inset hide-details
          @update:model-value="ui.updatePreferences({ snapToGrid: !!$event })"
        />
      </div>
      <div class="row">
        <div class="row-info">
          <div class="row-title">Auto-save</div>
          <div class="row-sub">Automatically save edits to local storage</div>
        </div>
        <v-switch
          :model-value="ui.preferences.autoSave"
          color="primary"
          inset hide-details
          @update:model-value="ui.updatePreferences({ autoSave: !!$event })"
        />
      </div>
    </section>

    <section class="setting-card">
      <h2>Storage</h2>
      <div class="row">
        <div class="row-info">
          <div class="row-title">Local data</div>
          <div class="row-sub">
            {{ docs.documents.length }} documents, {{ templates.templates.length }} templates,
            {{ sigs.signatures.length + sigs.initials.length }} signatures
          </div>
        </div>
        <v-btn variant="tonal" color="error" prepend-icon="mdi-delete-outline" @click="clearAllData">
          Clear all data
        </v-btn>
      </div>
    </section>

    <section class="setting-card">
      <h2>Keyboard shortcuts</h2>
      <ul class="shortcuts">
        <li><kbd>Ctrl</kbd> + <kbd>S</kbd> Save document</li>
        <li><kbd>Ctrl</kbd> + <kbd>Z</kbd> Undo</li>
        <li><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> Redo</li>
        <li><kbd>Ctrl</kbd> + <kbd>D</kbd> Duplicate selection</li>
        <li><kbd>Del</kbd> Delete selection</li>
        <li><kbd>Esc</kbd> Deselect</li>
        <li><kbd>Ctrl</kbd> + <kbd>+/-</kbd> Zoom in/out</li>
        <li><kbd>Ctrl</kbd> + <kbd>0</kbd> Reset zoom</li>
      </ul>
    </section>
  </div>
</template>

<style scoped lang="scss">
.settings { display: flex; flex-direction: column; gap: 18px; max-width: 760px; margin: 0 auto; }
.page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.01em; margin: 0; }
.page-sub { font-size: 13.5px; color: rgb(var(--v-theme-on-surface-variant)); margin: 4px 0 12px; }

.setting-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 14px;
  padding: 20px;
  h2 { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: rgb(var(--v-theme-on-surface-variant)); margin: 0 0 12px; }
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  gap: 16px;
  border-top: 1px solid rgb(var(--v-theme-border));
  &:first-of-type { border-top: 0; padding-top: 0; }
}
.row-info { flex: 1; min-width: 0; }
.row-title { font-weight: 600; font-size: 13.5px; }
.row-sub { font-size: 12.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 2px; }

.shortcuts {
  list-style: none;
  padding: 0; margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
  li { font-size: 13px; color: rgb(var(--v-theme-on-surface-variant)); display: flex; align-items: center; gap: 6px; }
}
kbd {
  display: inline-block;
  padding: 2px 6px;
  background: rgb(var(--v-theme-surface-variant));
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 4px;
  font-family: var(--ws-font-mono);
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}
</style>
