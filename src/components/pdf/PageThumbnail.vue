<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

const props = withDefaults(defineProps<{
  pdf: import('pdfjs-dist').PDFDocumentProxy | null
  pageIndex: number
  maxWidth?: number
}>(), { maxWidth: 96 })

const root = ref<HTMLDivElement | null>(null)
const dataUrl = ref<string | null>(null)
const error = ref(false)
const visible = ref(false)
let renderTask: ReturnType<import('pdfjs-dist').PDFPageProxy['render']> | null = null

useIntersectionObserver(
  root,
  ([entry]) => { visible.value = entry.isIntersecting },
  { threshold: 0.05, rootMargin: '120px' }
)

async function render() {
  if (!props.pdf || !visible.value || dataUrl.value || renderTask) return
  try {
    const page = await props.pdf.getPage(props.pageIndex)
    const base = page.getViewport({ scale: 1 })
    const scale = props.maxWidth / base.width
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    const ctx = canvas.getContext('2d', { alpha: false })!
    renderTask = page.render({ canvasContext: ctx, viewport, canvas })
    await renderTask.promise
    dataUrl.value = canvas.toDataURL('image/png')
  } catch (err: unknown) {
    const e = err as { name?: string }
    if (e?.name !== 'RenderingCancelledException') {
      console.error('[PageThumbnail] render failed', err)
      error.value = true
    }
  } finally {
    renderTask = null
  }
}

watch(() => [visible.value, props.pdf, props.pageIndex], () => {
  if (visible.value && !dataUrl.value) render()
})

onMounted(() => { if (visible.value) render() })
onBeforeUnmount(() => {
  if (renderTask) { try { renderTask.cancel() } catch { /* noop */ } }
})
</script>

<template>
  <div ref="root" class="page-thumb">
    <img v-if="dataUrl" :src="dataUrl" alt="" />
    <div v-else-if="error" class="page-thumb-fallback">!</div>
    <div v-else class="page-thumb-skeleton ws-skeleton" />
  </div>
</template>

<style scoped lang="scss">
.page-thumb {
  position: relative;
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 3px;
  overflow: hidden;
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
  }
}
.page-thumb-skeleton {
  position: absolute;
  inset: 0;
  border-radius: 3px;
}
.page-thumb-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgb(var(--v-theme-error));
  font-weight: 700;
}
</style>
