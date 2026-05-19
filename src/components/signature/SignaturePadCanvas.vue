<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import SignaturePad from 'signature_pad'

const props = withDefaults(defineProps<{
  color?: string
  width?: number
  height?: number
  minWidth?: number
  maxWidth?: number
}>(), {
  color: '#0f172a',
  width: 720,
  height: 240,
  minWidth: 0.6,
  maxWidth: 2.4
})

const emit = defineEmits<{
  (e: 'change', dataUrl: string | null): void
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let pad: SignaturePad | null = null

function resize() {
  if (!canvas.value) return
  const ratio = Math.max(window.devicePixelRatio || 1, 1)
  const c = canvas.value
  const w = c.parentElement?.clientWidth ?? props.width
  c.width = w * ratio
  c.height = props.height * ratio
  c.style.width = w + 'px'
  c.style.height = props.height + 'px'
  c.getContext('2d')?.scale(ratio, ratio)
  pad?.clear()
}

function init() {
  if (!canvas.value) return
  pad = new SignaturePad(canvas.value, {
    penColor: props.color,
    minWidth: props.minWidth,
    maxWidth: props.maxWidth,
    throttle: 8,
    backgroundColor: 'rgba(0,0,0,0)'
  })
  pad.addEventListener('endStroke', () => emit('change', pad!.isEmpty() ? null : pad!.toDataURL('image/png')))
}

function clear() {
  pad?.clear()
  emit('change', null)
}

function undo() {
  if (!pad) return
  const data = pad.toData()
  if (data.length) {
    data.pop()
    pad.fromData(data)
    emit('change', pad.isEmpty() ? null : pad.toDataURL('image/png'))
  }
}

function dataUrl(): string | null {
  if (!pad || pad.isEmpty()) return null
  return pad.toDataURL('image/png')
}

defineExpose({ clear, undo, dataUrl })

watch(() => props.color, (c) => { if (pad) pad.penColor = c })

onMounted(() => {
  init()
  resize()
  window.addEventListener('resize', resize)
})
onBeforeUnmount(() => {
  pad?.off()
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <div class="signature-pad-wrap">
    <canvas ref="canvas" class="signature-pad-canvas" />
    <div class="signature-baseline">Sign here</div>
  </div>
</template>

<style scoped lang="scss">
.signature-pad-wrap {
  position: relative;
  background:
    repeating-linear-gradient(45deg, rgba(99,102,241,0.03) 0 6px, transparent 6px 12px),
    #fff;
  border: 1.5px dashed rgb(var(--v-theme-border));
  border-radius: 12px;
  overflow: hidden;
}
.signature-pad-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
}
.signature-baseline {
  position: absolute;
  bottom: 14px;
  left: 16px;
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
  letter-spacing: 0.08em;
  text-transform: uppercase;
  pointer-events: none;
}
</style>
