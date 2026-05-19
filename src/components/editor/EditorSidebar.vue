<script setup lang="ts">
import { ref, computed } from 'vue'
import { FIELD_CATALOG, FIELD_TYPES } from '@/constants/fields'
import { useEditorStore } from '@/stores'
import type { FieldType } from '@/types'

const editor = useEditorStore()
const search = ref('')
const activeTab = ref<'fields' | 'pages'>('fields')

const filteredTypes = computed(() => {
  if (!search.value.trim()) return FIELD_TYPES
  const q = search.value.toLowerCase()
  return FIELD_TYPES.filter((t) => {
    const meta = FIELD_CATALOG[t]
    return meta.label.toLowerCase().includes(q) || meta.description.toLowerCase().includes(q)
  })
})

const pages = computed(() => editor.document?.pages ?? [])
const thumbnails = computed(() => editor.document?.thumbnail ?? '')

function onDragStart(e: DragEvent, type: FieldType) {
  if (!e.dataTransfer) return
  e.dataTransfer.setData('text/x-ws-field', type)
  e.dataTransfer.effectAllowed = 'copy'
}

function scrollToPage(idx: number) {
  editor.currentPage = idx
  document.querySelector(`[data-page="${idx}"]`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}
</script>

<template>
  <aside class="editor-sidebar">
    <div class="sidebar-tabs">
      <button
        :class="['tab', { active: activeTab === 'fields' }]"
        @click="activeTab = 'fields'"
      >
        <v-icon icon="mdi-shape-outline" size="16" />
        Fields
      </button>
      <button
        :class="['tab', { active: activeTab === 'pages' }]"
        @click="activeTab = 'pages'"
      >
        <v-icon icon="mdi-file-document-outline" size="16" />
        Pages
      </button>
    </div>

    <div v-if="activeTab === 'fields'" class="sidebar-body">
      <v-text-field
        v-model="search"
        density="compact"
        variant="solo-filled"
        placeholder="Search fields…"
        prepend-inner-icon="mdi-magnify"
        hide-details
        flat
        rounded="lg"
        class="mb-2"
      />

      <div class="field-grid">
        <div
          v-for="type in filteredTypes"
          :key="type"
          class="field-tile"
          draggable="true"
          @dragstart="onDragStart($event, type)"
          :title="FIELD_CATALOG[type].description"
        >
          <div
            class="field-tile-icon"
            :style="{
              background: FIELD_CATALOG[type].color + '18',
              color: FIELD_CATALOG[type].color
            }"
          >
            <v-icon :icon="FIELD_CATALOG[type].icon" size="20" />
          </div>
          <span class="field-tile-label">{{ FIELD_CATALOG[type].label }}</span>
        </div>
      </div>

      <div class="hint">
        <v-icon icon="mdi-cursor-default-click-outline" size="14" />
        <span>Drag a field onto the document</span>
      </div>
    </div>

    <div v-else class="sidebar-body">
      <div class="pages-list">
        <button
          v-for="page in pages"
          :key="page.index"
          class="page-tile"
          :class="{ active: editor.currentPage === page.index }"
          @click="scrollToPage(page.index)"
        >
          <div class="page-tile-thumb">
            <img v-if="page.index === 1 && thumbnails" :src="thumbnails" alt="" />
            <span v-else class="page-tile-placeholder">{{ page.index }}</span>
          </div>
          <span class="page-tile-label">Page {{ page.index }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.editor-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
  border-right: 1px solid rgb(var(--v-theme-border));
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid rgb(var(--v-theme-border));
}
.tab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
  transition: all 0.15s var(--ws-easing);
  &:hover { color: rgb(var(--v-theme-on-surface)); }
  &.active {
    color: rgb(var(--v-theme-primary));
    border-bottom-color: rgb(var(--v-theme-primary));
  }
}

.sidebar-body {
  padding: 14px;
  overflow-y: auto;
  flex: 1;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.field-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 8px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 10px;
  cursor: grab;
  transition: all 0.15s var(--ws-easing);
  text-align: center;
  user-select: none;
  &:hover {
    border-color: rgb(var(--v-theme-primary));
    transform: translateY(-1px);
    box-shadow: var(--ws-shadow-sm);
  }
  &:active { cursor: grabbing; transform: scale(0.98); }
}
.field-tile-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.field-tile-label {
  font-size: 12px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.hint {
  margin-top: 14px;
  padding: 10px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  display: flex;
  align-items: center;
  gap: 6px;
}

.pages-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.page-tile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s var(--ws-easing);
  &:hover { border-color: rgb(var(--v-theme-primary)); }
  &.active {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(99,102,241,0.06);
  }
}
.page-tile-thumb {
  width: 48px;
  height: 60px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  img { width: 100%; height: 100%; object-fit: cover; }
}
.page-tile-placeholder {
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
}
.page-tile-label {
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 900px) {
  .editor-sidebar { width: 220px; }
  .field-grid { grid-template-columns: 1fr; }
}
</style>
