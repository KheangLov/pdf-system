<script setup lang="ts">
import { computed, ref } from 'vue'
import PdfPage from '@/components/pdf/PdfPage.vue'
import FieldOverlay from './FieldOverlay.vue'
import { FIELD_CATALOG } from '@/constants/fields'
import { useEditorStore, useUIStore } from '@/stores'
import type { FieldType, DocumentPageMeta } from '@/types'

const props = defineProps<{
  pdf: import('pdfjs-dist').PDFDocumentProxy
  pages: DocumentPageMeta[]
}>()

const editor = useEditorStore()
const ui = useUIStore()
const scrollContainer = ref<HTMLElement | null>(null)

const showGrid = computed(() => ui.preferences.showGrid)
const isPreview = computed(() => editor.mode === 'preview')

/* Render the grid at the same screen-pixel spacing the snap divisions use,
 * scaled by the current zoom so the lines visually match where snap will
 * land. The page is 1 unit wide / GRID_DIVISIONS = 200 → step in normalized
 * units is 1/200, so on screen that's (pageWidth * zoom) / 200 pixels —
 * but a fine 200-line grid looks like static. Halve the resolution for
 * display so users can actually see and align to it. */
const gridStyle = computed(() => {
  const step = 1 / 50 /* visible grid every 4 snap divisions */
  return {
    backgroundImage: `
      linear-gradient(rgba(99,102,241,0.18) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.18) 1px, transparent 1px)
    `,
    backgroundSize: `${step * 100}% ${step * 100}%`
  }
})

function getPageElement(pageIndex: number): HTMLElement | null {
  return document.querySelector(`[data-page="${pageIndex}"]`)
}

function onDrop(e: DragEvent, page: DocumentPageMeta, pageWidth: number, pageHeight: number) {
  if (isPreview.value) return
  const type = e.dataTransfer?.getData('text/x-ws-field') as FieldType | undefined
  if (!type) return
  e.preventDefault()
  const meta = FIELD_CATALOG[type]
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = (e.clientX - rect.left) / pageWidth - meta.defaultWidth / 2
  const y = (e.clientY - rect.top) / pageHeight - meta.defaultHeight / 2
  editor.addField(type, {
    page: page.index,
    x: Math.max(0, Math.min(1 - meta.defaultWidth, x)),
    y: Math.max(0, Math.min(1 - meta.defaultHeight, y)),
    width: meta.defaultWidth,
    height: meta.defaultHeight
  })
}

function onCanvasClick(e: MouseEvent) {
  if (e.target === e.currentTarget) editor.clearSelection()
}

function fieldsForPage(idx: number) {
  return editor.fieldsByPage.get(idx) ?? []
}

defineExpose({ getPageElement })
</script>

<template>
  <div
    ref="scrollContainer"
    class="editor-canvas editor-canvas-bg"
    :class="{ 'is-preview': isPreview }"
    tabindex="0"
    @click="onCanvasClick"
  >
    <div v-if="isPreview" class="preview-banner">
      <v-icon icon="mdi-eye-outline" size="16" />
      <span>Preview mode — fields are read-only. Toggle off to keep editing.</span>
      <v-btn variant="text" size="x-small" color="white" @click.stop="editor.mode = 'prepare'">Exit preview</v-btn>
    </div>

    <div class="canvas-inner">
      <PdfPage
        v-for="page in pages"
        :key="page.index"
        :pdf="pdf"
        :page="page"
        :scale="editor.zoom"
        class="canvas-page-wrapper"
      >
        <template #default="{ width, height }">
          <div
            class="page-drop-layer"
            @dragover.prevent="!isPreview && $event.dataTransfer && ($event.dataTransfer.dropEffect = 'copy')"
            @drop="onDrop($event, page, width, height)"
            @click.self="editor.clearSelection()"
          >
            <div v-if="showGrid" class="page-grid" :style="gridStyle" />
            <FieldOverlay
              v-for="field in fieldsForPage(page.index)"
              :key="field.id"
              :field="field"
              :page-width="width"
              :page-height="height"
            />
          </div>
        </template>
      </PdfPage>
    </div>
  </div>
</template>

<style scoped lang="scss">
.editor-canvas {
  flex: 1;
  height: 100%;
  overflow: auto;
  position: relative;
  outline: none;
}
.editor-canvas.is-preview {
  background-color: rgba(99, 102, 241, 0.03);
}

.preview-banner {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 8px 14px;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  color: #fff;
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: 0.005em;
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.25);
}

.canvas-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px 24px 80px;
  min-height: 100%;
}
.canvas-page-wrapper { transition: transform 240ms var(--ws-easing); }

.page-drop-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
}

/* Sits inside the drop layer (above the PDF canvas, below field overlays) */
.page-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-position: 0 0;
  /* Slight fade so the PDF underneath is still readable */
  mix-blend-mode: multiply;
}

.is-preview .page-drop-layer { cursor: default; }
</style>
