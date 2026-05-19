<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import SignaturePadCanvas from './SignaturePadCanvas.vue'
import { SIGNATURE_FONTS } from '@/constants/fields'
import { useSignatureStore, useUIStore } from '@/stores'
import type { SavedSignature } from '@/types'

const props = defineProps<{
  modelValue: boolean
  mode?: 'signature' | 'initial'
  defaultText?: string
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'select', sig: { dataUrl: string; width: number; height: number; save: boolean }): void
}>()

const sigStore = useSignatureStore()
const ui = useUIStore()

const tab = ref<'draw' | 'type' | 'upload' | 'saved'>('saved')
const padRef = ref<InstanceType<typeof SignaturePadCanvas> | null>(null)
const drawDataUrl = ref<string | null>(null)
const typedText = ref('')
const typedFont = ref(SIGNATURE_FONTS[0].value)
const uploadDataUrl = ref<string | null>(null)
const saveAsDefault = ref(true)
const penColor = ref('#0f172a')

const typeCanvas = ref<HTMLCanvasElement | null>(null)

const isInitial = computed(() => props.mode === 'initial')
const savedList = computed(() => isInitial.value ? sigStore.initials : sigStore.signatures)

watch(() => props.modelValue, (open) => {
  if (open) {
    typedText.value = props.defaultText ?? ''
    drawDataUrl.value = null
    uploadDataUrl.value = null
    tab.value = savedList.value.length > 0 ? 'saved' : 'draw'
    nextTick(renderTypedSignature)
  }
})

watch([typedText, typedFont, penColor], renderTypedSignature)

function renderTypedSignature() {
  if (!typeCanvas.value || !typedText.value) return
  const c = typeCanvas.value
  const ratio = Math.max(window.devicePixelRatio || 1, 1)
  const w = 720
  const h = 160
  c.width = w * ratio
  c.height = h * ratio
  c.style.width = w + 'px'
  c.style.height = h + 'px'
  const ctx = c.getContext('2d')!
  ctx.scale(ratio, ratio)
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = penColor.value
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  const fontSize = isInitial.value ? 72 : 64
  ctx.font = `${fontSize}px ${typedFont.value}`
  ctx.fillText(typedText.value, w / 2, h / 2)
}

function getTypedDataUrl(): string | null {
  if (!typeCanvas.value || !typedText.value) return null
  return typeCanvas.value.toDataURL('image/png')
}

function handleUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { uploadDataUrl.value = reader.result as string }
  reader.readAsDataURL(file)
}

async function adopt() {
  let dataUrl: string | null = null
  let name = isInitial.value ? 'Initials' : 'Signature'
  let type: SavedSignature['type'] = 'draw'

  if (tab.value === 'draw') {
    dataUrl = padRef.value?.dataUrl() ?? null
    type = 'draw'
  } else if (tab.value === 'type') {
    dataUrl = getTypedDataUrl()
    name = typedText.value || name
    type = 'type'
  } else if (tab.value === 'upload') {
    dataUrl = uploadDataUrl.value
    type = 'upload'
  }

  if (!dataUrl) {
    ui.pushToast('Please provide a signature first', 'warning')
    return
  }

  const img = await loadImage(dataUrl)

  if (saveAsDefault.value && tab.value !== 'saved') {
    await sigStore.save({
      name: isInitial.value ? `Initials: ${name}` : name,
      type,
      dataUrl,
      width: img.width,
      height: img.height,
      isDefault: false
    })
  }

  emit('select', { dataUrl, width: img.width, height: img.height, save: saveAsDefault.value })
  emit('update:modelValue', false)
}

function chooseSaved(sig: SavedSignature) {
  emit('select', { dataUrl: sig.dataUrl, width: sig.width, height: sig.height, save: false })
  emit('update:modelValue', false)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function close() { emit('update:modelValue', false) }
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="780"
    scrollable
  >
    <v-card class="signature-modal">
      <div class="modal-header">
        <div>
          <h2 class="modal-title">{{ isInitial ? 'Adopt initials' : 'Adopt your signature' }}</h2>
          <p class="modal-sub">Saved locally on this device. Never sent anywhere.</p>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="close" />
      </div>

      <v-tabs
        v-model="tab"
        density="comfortable"
        color="primary"
        class="px-4"
        grow
      >
        <v-tab v-if="savedList.length" value="saved" prepend-icon="mdi-bookmark-outline">Saved</v-tab>
        <v-tab value="draw" prepend-icon="mdi-draw">Draw</v-tab>
        <v-tab value="type" prepend-icon="mdi-keyboard-outline">Type</v-tab>
        <v-tab value="upload" prepend-icon="mdi-tray-arrow-up">Upload</v-tab>
      </v-tabs>

      <v-card-text class="pa-5">
        <v-window v-model="tab">
          <v-window-item value="saved">
            <div v-if="savedList.length === 0" class="empty-state">
              <v-icon icon="mdi-bookmark-off-outline" size="40" class="mb-2" />
              <p>No saved {{ isInitial ? 'initials' : 'signatures' }} yet.</p>
            </div>
            <div v-else class="saved-grid">
              <button
                v-for="s in savedList"
                :key="s.id"
                class="saved-tile"
                @click="chooseSaved(s)"
              >
                <img :src="s.dataUrl" alt="" />
                <span class="saved-name">{{ s.name }}</span>
                <v-btn
                  icon="mdi-trash-can-outline"
                  size="x-small"
                  variant="text"
                  class="saved-delete"
                  @click.stop="sigStore.remove(s.id)"
                />
              </button>
            </div>
          </v-window-item>

          <v-window-item value="draw">
            <div class="pen-row">
              <span class="row-label">Pen color</span>
              <button
                v-for="c in ['#0f172a', '#1d4ed8', '#7c3aed']"
                :key="c"
                class="color-chip"
                :style="{ background: c }"
                :class="{ active: penColor === c }"
                @click="penColor = c"
              />
              <v-spacer />
              <v-btn variant="text" size="small" prepend-icon="mdi-undo" @click="padRef?.undo()">Undo</v-btn>
              <v-btn variant="text" size="small" prepend-icon="mdi-eraser" @click="padRef?.clear()">Clear</v-btn>
            </div>
            <SignaturePadCanvas
              ref="padRef"
              :color="penColor"
              :height="240"
              @change="drawDataUrl = $event"
            />
          </v-window-item>

          <v-window-item value="type">
            <v-text-field
              v-model="typedText"
              :label="isInitial ? 'Your initials' : 'Your full name'"
              :maxlength="isInitial ? 4 : 40"
              autofocus
              class="mb-3"
            />
            <div class="font-row">
              <button
                v-for="f in SIGNATURE_FONTS"
                :key="f.value"
                class="font-chip"
                :class="{ active: typedFont === f.value }"
                :style="{ fontFamily: f.value }"
                @click="typedFont = f.value"
              >
                {{ typedText || (isInitial ? 'AB' : 'Your name') }}
              </button>
            </div>
            <div class="type-preview">
              <canvas ref="typeCanvas" />
            </div>
          </v-window-item>

          <v-window-item value="upload">
            <div class="upload-zone">
              <input
                type="file"
                accept="image/png,image/jpeg"
                @change="handleUpload"
                id="sig-upload"
                class="upload-input"
              />
              <label for="sig-upload" class="upload-label">
                <v-icon icon="mdi-tray-arrow-up" size="32" />
                <span class="upload-title">Upload signature image</span>
                <span class="upload-hint">PNG or JPEG with transparent background works best</span>
              </label>
              <div v-if="uploadDataUrl" class="upload-preview">
                <img :src="uploadDataUrl" alt="Uploaded signature" />
              </div>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />
      <v-card-actions class="px-5 py-3">
        <v-checkbox
          v-if="tab !== 'saved'"
          v-model="saveAsDefault"
          label="Save for next time"
          hide-details
          density="compact"
        />
        <v-spacer />
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn
          v-if="tab !== 'saved'"
          color="primary"
          variant="flat"
          @click="adopt"
        >
          Adopt &amp; sign
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.signature-modal { border-radius: 16px; overflow: hidden; }
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 20px 8px;
}
.modal-title { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; margin: 0; }
.modal-sub { margin: 4px 0 0; font-size: 13px; color: rgb(var(--v-theme-on-surface-variant)); }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.saved-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.saved-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px;
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  transition: all 0.15s var(--ws-easing);
  &:hover { border-color: rgb(var(--v-theme-primary)); transform: translateY(-1px); box-shadow: var(--ws-shadow-md); }
}
.saved-tile img { max-width: 100%; height: 64px; object-fit: contain; }
.saved-name { font-size: 12px; margin-top: 8px; color: rgb(var(--v-theme-on-surface-variant)); }
.saved-delete { position: absolute; top: 4px; right: 4px; }

.pen-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.row-label { font-size: 12px; color: rgb(var(--v-theme-on-surface-variant)); margin-right: 4px; }
.color-chip {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.12s;
  &:hover { transform: scale(1.1); }
  &.active { border-color: rgb(var(--v-theme-primary)); box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
}

.font-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 14px; }
.font-chip {
  font-size: 26px;
  padding: 10px;
  background: rgb(var(--v-theme-surface));
  border: 1.5px solid rgb(var(--v-theme-border));
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s var(--ws-easing);
  text-align: center;
  &:hover { border-color: rgb(var(--v-theme-primary)); }
  &.active { border-color: rgb(var(--v-theme-primary)); background: rgba(99,102,241,0.06); }
}
.type-preview {
  background: #fff;
  border-radius: 10px;
  border: 1.5px dashed rgb(var(--v-theme-border));
  padding: 8px;
  overflow: hidden;
  canvas { display: block; max-width: 100%; }
}

.upload-zone { position: relative; }
.upload-input { display: none; }
.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 36px;
  background: rgb(var(--v-theme-surface-variant));
  border: 1.5px dashed rgb(var(--v-theme-border));
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s var(--ws-easing);
  &:hover { border-color: rgb(var(--v-theme-primary)); }
}
.upload-title { font-weight: 600; }
.upload-hint { font-size: 12px; color: rgb(var(--v-theme-on-surface-variant)); }
.upload-preview { margin-top: 12px; padding: 10px; background: #fff; border-radius: 10px; text-align: center; }
.upload-preview img { max-height: 120px; }
</style>
