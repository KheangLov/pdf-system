<script setup lang="ts">
import { ref, onMounted, shallowRef, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PdfPage from '@/components/pdf/PdfPage.vue'
import SigningField from '@/components/signing/SigningField.vue'
import SignatureModal from '@/components/signature/SignatureModal.vue'
import { useDocumentStore, useUIStore } from '@/stores'
import { loadPdfFromData } from '@/services/pdf/loader'
import { downloadSignedPdf } from '@/services/pdf/exporter'
import type { SignDocument, SignField } from '@/types'
import dayjs from 'dayjs'
import { cloneDeep } from 'lodash-es'

const route = useRoute()
const router = useRouter()
const docs = useDocumentStore()
const ui = useUIStore()

const pdfDoc = shallowRef<import('pdfjs-dist').PDFDocumentProxy | null>(null)
const document = ref<SignDocument | null>(null)
const isLoading = ref(true)
const zoom = ref(1)
const activeFieldId = ref<string | null>(null)
const sigModalOpen = ref(false)
const sigModalMode = ref<'signature' | 'initial'>('signature')

const completedCount = computed(() =>
  document.value?.fields.filter((f) => {
    if (f.type === 'checkbox') return f.value === true
    return f.value != null && f.value !== ''
  }).length ?? 0
)
const requiredFields = computed(() => document.value?.fields.filter((f) => f.required) ?? [])
const requiredCompleted = computed(() =>
  requiredFields.value.filter((f) => {
    if (f.type === 'checkbox') return f.value === true
    return f.value != null && f.value !== ''
  }).length
)
const progress = computed(() => {
  const total = requiredFields.value.length || document.value?.fields.length || 1
  const done = requiredFields.value.length ? requiredCompleted.value : completedCount.value
  return Math.round((done / total) * 100)
})
const canSubmit = computed(() =>
  requiredFields.value.length === 0 ||
  requiredFields.value.every((f) =>
    f.type === 'checkbox' ? f.value === true : f.value != null && f.value !== ''
  )
)

async function load() {
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
    document.value = { ...doc, fields: cloneDeep(doc.fields) }
    /* Apply default values & auto-fill dates */
    for (const f of document.value.fields) {
      if (f.value == null || f.value === '') {
        if (f.type === 'date') f.value = dayjs().format('YYYY-MM-DD')
        else if (f.defaultValue != null) f.value = f.defaultValue
      }
    }
  } finally {
    isLoading.value = false
  }
}

function onFieldClick(field: SignField) {
  activeFieldId.value = field.id
  if (field.type === 'signature') { sigModalMode.value = 'signature'; sigModalOpen.value = true }
  else if (field.type === 'initial') { sigModalMode.value = 'initial'; sigModalOpen.value = true }
}

function updateField(id: string, value: string | boolean | null) {
  if (!document.value) return
  document.value.fields = document.value.fields.map((f) => f.id === id ? { ...f, value } : f)
}

function onSignaturePicked({ dataUrl }: { dataUrl: string }) {
  if (!activeFieldId.value) return
  updateField(activeFieldId.value, dataUrl)
  /* Move to next empty field */
  const nextEmpty = document.value?.fields.find((f) => f.id !== activeFieldId.value && (f.value == null || f.value === '') && f.required)
  if (nextEmpty) activeFieldId.value = nextEmpty.id
}

function fieldsForPage(idx: number) {
  return document.value?.fields.filter((f) => f.position.page === idx) ?? []
}

function nextField() {
  if (!document.value) return
  const list = document.value.fields
  const idx = list.findIndex((f) => f.id === activeFieldId.value)
  const next = list[(idx + 1 + list.length) % list.length]
  if (next) {
    activeFieldId.value = next.id
    window.document.querySelector(`[data-page="${next.position.page}"]`)?.scrollIntoView({ behavior: 'smooth' })
  }
}

async function submit() {
  if (!document.value) return
  if (!canSubmit.value) { ui.pushToast('Please complete all required fields', 'warning'); return }
  document.value.status = 'signed'
  document.value.signedAt = Date.now()
  await docs.save({ ...document.value, fields: cloneDeep(document.value.fields) })
  await downloadSignedPdf(document.value)
  ui.pushToast('Document signed & downloaded', 'success')
  router.push('/documents')
}

watch(activeFieldId, (id) => {
  if (!id) return
  window.document.querySelector(`[data-field-id="${id}"]`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
})

onMounted(load)
</script>

<template>
  <div class="signing-shell">
    <header class="signing-toolbar ws-glass">
      <div class="left">
        <v-btn icon="mdi-arrow-left" variant="text" size="small" @click="router.push('/documents')" />
        <div class="doc-meta">
          <div class="doc-title">{{ document?.name ?? 'Document' }}</div>
          <div class="doc-sub">Signing mode</div>
        </div>
      </div>

      <div class="center">
        <div class="progress-pill">
          <v-progress-circular :model-value="progress" color="primary" size="32" width="3">
            <span class="progress-text">{{ progress }}%</span>
          </v-progress-circular>
          <div class="progress-meta">
            <span class="progress-label">{{ requiredCompleted }} of {{ requiredFields.length || document?.fields.length || 0 }}</span>
            <span class="progress-sub">fields completed</span>
          </div>
        </div>
      </div>

      <div class="right">
        <v-btn-toggle density="compact" rounded="pill">
          <v-btn icon="mdi-magnify-minus-outline" size="small" rounded="fill" @click="zoom = Math.max(0.5, zoom - 0.1)" />
          <v-btn size="small" rounded="fill" @click="zoom = 1">{{ Math.round(zoom * 100) }}%</v-btn>
          <v-btn icon="mdi-magnify-plus-outline" size="small" rounded="fill" @click="zoom = Math.min(2.5, zoom + 0.1)" />
        </v-btn-toggle>

        <v-btn
          variant="text"
          size="small"
          prepend-icon="mdi-arrow-right-bottom"
          @click="nextField"
        >Next field</v-btn>

        <v-btn
          variant="flat"
          color="primary"
          prepend-icon="mdi-check"
          size="small"
          :disabled="!canSubmit"
          @click="submit"
        >Finish & download</v-btn>
      </div>
    </header>

    <main class="signing-canvas editor-canvas-bg">
      <div v-if="isLoading" class="signing-loading">
        <v-progress-circular indeterminate color="primary" size="40" width="3" />
      </div>

      <div v-else-if="pdfDoc && document" class="canvas-inner">
        <PdfPage
          v-for="page in document.pages"
          :key="page.index"
          :pdf="pdfDoc"
          :page="page"
          :scale="zoom"
        >
          <template #default="{ width, height }">
            <div class="signing-overlay" :data-page="page.index">
              <SigningField
                v-for="f in fieldsForPage(page.index)"
                :key="f.id"
                :field="f"
                :page-width="width"
                :page-height="height"
                :active="activeFieldId === f.id"
                :data-field-id="f.id"
                @click="onFieldClick(f)"
                @update="updateField(f.id, $event)"
              />
            </div>
          </template>
        </PdfPage>
      </div>
    </main>

    <SignatureModal
      v-model="sigModalOpen"
      :mode="sigModalMode"
      @select="onSignaturePicked"
    />
  </div>
</template>

<style scoped lang="scss">
.signing-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.signing-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  height: 64px;
  border-bottom: 1px solid rgb(var(--v-theme-border));
  z-index: 20;
}
.signing-toolbar .left { display: flex; align-items: center; gap: 6px; flex: 1; }
.signing-toolbar .center { display: flex; align-items: center; flex-shrink: 0; }
.signing-toolbar .right { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: flex-end; }

.doc-meta { line-height: 1.2; min-width: 0; }
.doc-title { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px; }
.doc-sub { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); }

.progress-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 6px 8px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 999px;
}
.progress-text { font-size: 9px; font-weight: 700; }
.progress-meta { line-height: 1.2; }
.progress-label { font-weight: 600; font-size: 12.5px; display: block; }
.progress-sub { font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant)); }

.signing-canvas { flex: 1; overflow: auto; }
.signing-loading { display: flex; align-items: center; justify-content: center; height: 100%; }
.canvas-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px 24px 96px;
}
.signing-overlay { position: absolute; inset: 0; z-index: 2; }

@media (max-width: 760px) {
  .signing-toolbar .center { display: none; }
  .doc-title { max-width: 140px; }
}
</style>
