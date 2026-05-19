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

function getPageElement(pageIndex: number): HTMLElement | null {
  return document.querySelector(`[data-page="${pageIndex}"]`)
}

function onDrop(e: DragEvent, page: DocumentPageMeta, pageWidth: number, pageHeight: number) {
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
    :class="{ 'with-grid': showGrid }"
    tabindex="0"
    @click="onCanvasClick"
  >
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
            @dragover.prevent="$event.dataTransfer && ($event.dataTransfer.dropEffect = 'copy')"
            @drop="onDrop($event, page, width, height)"
            @click.self="editor.clearSelection()"
          >
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

.with-grid .canvas-page-wrapper :deep(.pdf-page) {
  background-image:
    linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0;
}
</style>
