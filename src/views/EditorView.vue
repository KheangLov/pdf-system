<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef, provide } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import EditorToolbar from '@/components/editor/EditorToolbar.vue'
import EditorSidebar from '@/components/editor/EditorSidebar.vue'
import EditorInspector from '@/components/editor/EditorInspector.vue'
import EditorCanvas from '@/components/editor/EditorCanvas.vue'
import TemplateSaveDialog from '@/components/editor/TemplateSaveDialog.vue'
import { useDocumentStore, useEditorStore, useHistoryStore, useUIStore } from '@/stores'
import { loadPdfFromData } from '@/services/pdf/loader'
import { useAutoSave } from '@/composables/useAutoSave'

const route = useRoute()
const router = useRouter()
const docs = useDocumentStore()
const editor = useEditorStore()
const history = useHistoryStore()
const ui = useUIStore()

const pdfDoc = shallowRef<import('pdfjs-dist').PDFDocumentProxy | null>(null)
const isLoading = ref(true)
const templateDialog = ref(false)

provide('pdfDoc', pdfDoc)

async function loadDocument() {
  isLoading.value = true
  try {
    const doc = await docs.getById(route.params.id as string)
    if (!doc) {
      ui.pushToast('Document not found', 'error')
      router.push('/documents')
      return
    }
    const loaded = await loadPdfFromData(doc.pdfData)
    pdfDoc.value = loaded.document
    editor.setDocument(doc)
  } finally {
    isLoading.value = false
  }
}

async function handleSave() {
  await editor.persist()
  ui.pushToast('Document saved', 'success')
}

function handlePreview() {
  editor.mode = editor.mode === 'preview' ? 'prepare' : 'preview'
  ui.pushToast(`Preview mode ${editor.mode === 'preview' ? 'on' : 'off'}`, 'info', 1500)
}

async function startSigning() {
  await editor.persist()
  router.push({ name: 'sign', params: { id: editor.document!.id } })
}

useAutoSave(() => editor.document?.fields, async () => {
  if (ui.preferences.autoSave && editor.document) {
    await editor.persist()
  }
})

/* Convert N pixels into normalised page-relative units. Falls back to a
 * typical A4 width (~612pt) when no document is loaded so the math is safe
 * even before the first render. */
function nudgeStep(px: number): { dx: number; dy: number } {
  const page = editor.document?.pages[0]
  const w = page?.width ?? 612
  const h = page?.height ?? 792
  return { dx: px / w, dy: px / h }
}

useEventListener('keydown', (e: KeyboardEvent) => {
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
  const cmd = e.ctrlKey || e.metaKey
  if (cmd && e.key.toLowerCase() === 's') {
    e.preventDefault(); handleSave()
  } else if (cmd && e.shiftKey && e.key.toLowerCase() === 'z') {
    e.preventDefault(); const snap = history.redo(); if (snap) editor.restoreFields(snap)
  } else if (cmd && e.key.toLowerCase() === 'z') {
    e.preventDefault(); const snap = history.undo(); if (snap) editor.restoreFields(snap)
  } else if (cmd && e.key.toLowerCase() === 'd') {
    e.preventDefault(); editor.duplicateSelection()
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (editor.selectedIds.size > 0) { e.preventDefault(); editor.deleteSelection() }
  } else if (e.key === 'Escape') {
    editor.clearSelection()
  } else if (cmd && e.key === '+') { e.preventDefault(); editor.zoomIn() }
  else if (cmd && e.key === '-') { e.preventDefault(); editor.zoomOut() }
  else if (cmd && e.key === '0') { e.preventDefault(); editor.resetZoom() }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    if (editor.selectedIds.size === 0) return
    e.preventDefault()
    const step = nudgeStep(e.shiftKey ? 10 : 1)
    const dx = e.key === 'ArrowLeft' ? -step.dx : e.key === 'ArrowRight' ? step.dx : 0
    const dy = e.key === 'ArrowUp' ? -step.dy : e.key === 'ArrowDown' ? step.dy : 0
    editor.nudgeSelection(dx, dy)
  }
})

watch(() => route.params.id, () => loadDocument())
onMounted(loadDocument)
onBeforeUnmount(() => { editor.reset() })

onBeforeRouteLeave(async () => {
  if (ui.preferences.autoSave && editor.document) {
    await editor.persist()
  }
})
</script>

<template>
  <div class="editor-shell">
    <EditorToolbar
      @save="handleSave"
      @preview="handlePreview"
      @save-template="templateDialog = true"
      @start-signing="startSigning"
    />

    <div class="editor-body">
      <EditorSidebar />

      <div v-if="isLoading" class="editor-loading">
        <div class="loader-spinner">
          <v-progress-circular color="primary" indeterminate size="40" width="3" />
          <span class="mt-3 text-body-2">Preparing document…</span>
        </div>
      </div>

      <EditorCanvas
        v-else-if="pdfDoc && editor.document"
        :pdf="pdfDoc"
        :pages="editor.document.pages"
      />

      <EditorInspector />
    </div>

    <TemplateSaveDialog v-model="templateDialog" />
  </div>
</template>

<style scoped lang="scss">
.editor-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-background));
  overflow: hidden;
}
.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.editor-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loader-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: rgb(var(--v-theme-on-surface-variant));
}

@media (max-width: 800px) {
  .editor-body { flex-direction: column; }
}
</style>
