<script setup lang="ts">
import { ref, computed, inject, type ShallowRef } from 'vue'
import { FIELD_CATALOG, FIELD_TYPES } from '@/constants/fields'
import { useEditorStore } from '@/stores'
import PageThumbnail from '@/components/pdf/PageThumbnail.vue'
import type { FieldType } from '@/types'

const editor = useEditorStore()
const search = ref('')
const activeTab = ref<'fields' | 'pages'>('fields')

const pdfDoc = inject<ShallowRef<import('pdfjs-dist').PDFDocumentProxy | null>>(
  'pdfDoc',
  /* fallback for safety — render nothing if EditorView didn't provide */
  ref(null) as unknown as ShallowRef<import('pdfjs-dist').PDFDocumentProxy | null>
)

const filteredTypes = computed(() => {
  if (!search.value.trim()) return FIELD_TYPES
  const q = search.value.toLowerCase()
  return FIELD_TYPES.filter((t) => {
    const meta = FIELD_CATALOG[t]
    return meta.label.toLowerCase().includes(q) || meta.description.toLowerCase().includes(q)
  })
})

const pages = computed(() => editor.document?.pages ?? [])

function fieldsOnPage(pageIndex: number): number {
  return editor.fields.filter((f) => f.position.page === pageIndex).length
}

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
        <span v-if="pages.length" class="tab-badge">{{ pages.length }}</span>
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
            <PageThumbnail
              :pdf="pdfDoc"
              :page-index="page.index"
              :max-width="120"
            />
            <span class="page-tile-number">{{ page.index }}</span>
          </div>
          <div class="page-tile-meta">
            <span class="page-tile-label">Page {{ page.index }}</span>
            <span v-if="fieldsOnPage(page.index)" class="page-tile-fields">
              <v-icon icon="mdi-vector-square" size="11" />
              {{ fieldsOnPage(page.index) }}
            </span>
          </div>
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
.tab-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.4;
}
.tab.active .tab-badge {
  background: rgba(99, 102, 241, 0.15);
  color: rgb(var(--v-theme-primary));
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
  gap: 10px;
}
.page-tile {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 10px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.18s var(--ws-easing);
  text-align: left;
  &:hover {
    border-color: rgb(var(--v-theme-primary));
    transform: translateY(-1px);
    box-shadow: var(--ws-shadow-sm);
  }
  &.active {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(99, 102, 241, 0.05);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.18);
  }
}
.page-tile-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 8.5 / 11;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 6px;
  overflow: hidden;
  box-shadow: var(--ws-shadow-sm);
}
.page-tile-number {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(15, 23, 42, 0.78);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
  letter-spacing: 0.02em;
}
.page-tile-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.page-tile-label {
  font-size: 12.5px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}
.page-tile-fields {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  background: rgba(99, 102, 241, 0.10);
  padding: 2px 6px;
  border-radius: 4px;
}

@media (max-width: 900px) {
  .editor-sidebar { width: 240px; }
  .field-grid { grid-template-columns: 1fr; }
}
</style>
