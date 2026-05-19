<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { pdfjsLib } from '@/services/pdf/worker'
import type { DocumentPageMeta } from '@/types'

const props = defineProps<{
  pdf: import('pdfjs-dist').PDFDocumentProxy
  page: DocumentPageMeta
  scale: number
}>()

const wrapper = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const isRendered = ref(false)
const isInView = ref(false)
let renderTask: ReturnType<import('pdfjs-dist').PDFPageProxy['render']> | null = null
let pendingScale = props.scale

const displayWidth = computed(() => props.page.width * props.scale)
const displayHeight = computed(() => props.page.height * props.scale)

useIntersectionObserver(
  wrapper,
  ([entry]) => { isInView.value = entry.isIntersecting },
  { threshold: 0.01 }
)

async function render() {
  if (!canvas.value || !isInView.value) return
  if (renderTask) {
    try { renderTask.cancel() } catch { /* noop */ }
  }
  const targetScale = props.scale
  pendingScale = targetScale
  const page = await props.pdf.getPage(props.page.index)
  if (targetScale !== pendingScale) return
  const viewport = page.getViewport({ scale: targetScale })
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const cv = canvas.value
  cv.width = Math.floor(viewport.width * dpr)
  cv.height = Math.floor(viewport.height * dpr)
  cv.style.width = `${viewport.width}px`
  cv.style.height = `${viewport.height}px`
  const ctx = cv.getContext('2d', { alpha: false })!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  renderTask = page.render({ canvasContext: ctx, viewport, canvas: cv })
  try {
    await renderTask.promise
    isRendered.value = true
  } catch (err: unknown) {
    const e = err as { name?: string }
    if (e?.name !== 'RenderingCancelledException') console.error(err)
  } finally {
    renderTask = null
  }
}

watch(() => [props.scale, isInView.value, props.page.index], () => {
  if (isInView.value) render()
})

onMounted(() => { if (isInView.value) render() })
onBeforeUnmount(() => { if (renderTask) { try { renderTask.cancel() } catch { /* noop */ } } })
</script>

<template>
  <div
    ref="wrapper"
    class="pdf-page"
    :style="{ width: displayWidth + 'px', height: displayHeight + 'px' }"
    :data-page="page.index"
  >
    <div v-if="!isRendered" class="pdf-page-skeleton ws-skeleton" />
    <canvas ref="canvas" class="pdf-page-canvas" />
    <slot :width="displayWidth" :height="displayHeight" />
  </div>
</template>

<style scoped lang="scss">
.pdf-page {
  position: relative;
  background: #fff;
  border-radius: 6px;
  box-shadow: var(--ws-shadow-md);
  margin: 0 auto;
  overflow: hidden;
}
.pdf-page-canvas {
  display: block;
  position: relative;
  z-index: 1;
}
.pdf-page-skeleton {
  position: absolute;
  inset: 0;
  z-index: 0;
}
</style>
