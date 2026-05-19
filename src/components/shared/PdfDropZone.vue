<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentStore, useUIStore } from '@/stores'

const router = useRouter()
const docs = useDocumentStore()
const ui = useUIStore()

const isDragging = ref(false)
const isUploading = ref(false)
const input = ref<HTMLInputElement | null>(null)

async function handleFiles(files: FileList | File[]) {
  const list = Array.from(files).filter((f) => /\.pdf$/i.test(f.name))
  if (list.length === 0) {
    ui.pushToast('Please upload a PDF file', 'warning')
    return
  }
  isUploading.value = true
  try {
    const first = list[0]
    const doc = await docs.importPdf(first)
    ui.pushToast(`${first.name} uploaded`, 'success')
    for (let i = 1; i < list.length; i++) await docs.importPdf(list[i])
    router.push({ name: 'editor', params: { id: doc.id } })
  } catch (err) {
    console.error(err)
    ui.pushToast('Failed to import PDF', 'error')
  } finally {
    isUploading.value = false
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files)
}

function onSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files?.length) handleFiles(files)
}
</script>

<template>
  <div
    class="dropzone"
    :class="{ 'is-dragging': isDragging, 'is-busy': isUploading }"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
    @click="input?.click()"
  >
    <input ref="input" type="file" accept="application/pdf" multiple class="hidden-input" @change="onSelect" />
    <div class="dropzone-content">
      <div class="dropzone-icon">
        <v-icon :icon="isUploading ? 'mdi-loading mdi-spin' : 'mdi-cloud-upload-outline'" size="44" />
      </div>
      <h3 class="dropzone-title">
        {{ isUploading ? 'Importing…' : 'Drop a PDF, or click to browse' }}
      </h3>
      <p class="dropzone-sub">
        Documents are stored locally. They never leave your browser.
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dropzone {
  position: relative;
  border: 2px dashed rgb(var(--v-theme-border));
  border-radius: 20px;
  padding: 56px 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s var(--ws-easing);
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
  &:hover {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(99,102,241,0.04);
  }
  &.is-dragging {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(99,102,241,0.08);
    transform: scale(1.01);
  }
  &.is-busy { cursor: progress; pointer-events: none; }
}
.dropzone-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 20px;
  background: rgba(99,102,241,0.10);
  color: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  justify-content: center;
}
.dropzone-title {
  font-size: 17px;
  font-weight: 600;
  margin: 0 0 6px;
  letter-spacing: -0.01em;
}
.dropzone-sub {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0;
}
.hidden-input { display: none; }
</style>
