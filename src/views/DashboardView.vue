<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PdfDropZone from '@/components/shared/PdfDropZone.vue'
import DocumentCard from '@/components/shared/DocumentCard.vue'
import { useDocumentStore, useTemplateStore, useSignatureStore } from '@/stores'
import { downloadSignedPdf } from '@/services/pdf/exporter'

const router = useRouter()
const docs = useDocumentStore()
const templates = useTemplateStore()
const sigs = useSignatureStore()

const recentDocs = computed(() => docs.documents.slice(0, 6))

const stats = computed(() => [
  { label: 'Documents', value: docs.documents.length, icon: 'mdi-file-document-outline', color: '#6366f1' },
  { label: 'Templates', value: templates.templates.length, icon: 'mdi-file-replace-outline', color: '#8b5cf6' },
  { label: 'Signatures', value: sigs.signatures.length + sigs.initials.length, icon: 'mdi-draw-pen', color: '#0ea5e9' },
  { label: 'Signed', value: docs.signedDocuments.length, icon: 'mdi-check-decagram', color: '#10b981' }
])

function openDoc(id: string) { router.push({ name: 'editor', params: { id } }) }
function signDoc(id: string) { router.push({ name: 'sign', params: { id } }) }
async function duplicateDoc(id: string) { await docs.duplicate(id) }
async function removeDoc(id: string) { await docs.remove(id) }
async function downloadDoc(id: string) {
  const doc = await docs.getById(id)
  if (doc) downloadSignedPdf(doc)
}
</script>

<template>
  <div class="dashboard ws-mesh-bg">
    <section class="hero">
      <div class="hero-text">
        <span class="hero-eyebrow">Welcome back</span>
        <h1 class="hero-title">Sign smarter with <span class="ws-gradient-text">Wing Sign</span></h1>
        <p class="hero-sub">
          Prepare, send, and sign PDFs from your browser — fully offline and beautifully fast.
        </p>
      </div>
    </section>

    <section class="stats">
      <div v-for="s in stats" :key="s.label" class="stat-card">
        <div class="stat-icon" :style="{ background: s.color + '18', color: s.color }">
          <v-icon :icon="s.icon" />
        </div>
        <div>
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </section>

    <section class="upload-section">
      <div class="section-head">
        <h2>Start a new document</h2>
        <v-btn variant="text" size="small" append-icon="mdi-arrow-right" @click="router.push('/templates')">
          Browse templates
        </v-btn>
      </div>
      <PdfDropZone />
    </section>

    <section class="recent">
      <div class="section-head">
        <h2>Recent documents</h2>
        <v-btn variant="text" size="small" append-icon="mdi-arrow-right" @click="router.push('/documents')">
          View all
        </v-btn>
      </div>

      <div v-if="recentDocs.length === 0" class="empty">
        <v-icon icon="mdi-file-document-multiple-outline" size="56" />
        <p>No documents yet — upload your first PDF above to get started.</p>
      </div>
      <div v-else class="doc-grid">
        <DocumentCard
          v-for="doc in recentDocs"
          :key="doc.id"
          :document="doc"
          @open="openDoc(doc.id)"
          @sign="signDoc(doc.id)"
          @duplicate="duplicateDoc(doc.id)"
          @remove="removeDoc(doc.id)"
          @download="downloadDoc(doc.id)"
        />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.dashboard { display: flex; flex-direction: column; gap: 32px; }

.hero {
  padding: 24px 0 8px;
}
.hero-eyebrow {
  display: inline-block;
  background: rgba(99,102,241,0.10);
  color: rgb(var(--v-theme-primary));
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 999px;
  margin-bottom: 12px;
}
.hero-title {
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 0 0 10px;
}
.hero-sub {
  font-size: 15px;
  color: rgb(var(--v-theme-on-surface-variant));
  max-width: 580px;
  margin: 0;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 14px;
  transition: all 0.2s var(--ws-easing);
  &:hover { transform: translateY(-1px); box-shadow: var(--ws-shadow-md); }
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-value { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; line-height: 1; }
.stat-label { font-size: 12px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 4px; }

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  h2 { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; margin: 0; }
}

.doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.empty {
  padding: 60px 20px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
  background: rgb(var(--v-theme-surface));
  border: 1px dashed rgb(var(--v-theme-border));
  border-radius: 14px;
  p { margin: 12px 0 0; font-size: 13.5px; }
}

@media (max-width: 800px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
