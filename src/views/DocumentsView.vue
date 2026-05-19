<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import PdfDropZone from '@/components/shared/PdfDropZone.vue'
import DocumentCard from '@/components/shared/DocumentCard.vue'
import { useDocumentStore } from '@/stores'
import { downloadSignedPdf } from '@/services/pdf/exporter'

const router = useRouter()
const docs = useDocumentStore()

const search = ref('')
const statusFilter = ref<string>('all')

const filtered = computed(() => {
  let list = docs.documents
  if (statusFilter.value !== 'all') list = list.filter((d) => d.status === statusFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((d) => d.name.toLowerCase().includes(q))
  }
  return list
})
</script>

<template>
  <div class="documents">
    <div class="head-row">
      <div>
        <h1 class="page-title">Documents</h1>
        <p class="page-sub">Manage and sign your PDFs</p>
      </div>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-upload" size="large">
        <label class="upload-label">
          Upload PDF
          <input type="file" accept="application/pdf" class="hidden-input" @change="(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) docs.importPdf(f).then(d => router.push({ name: 'editor', params: { id: d.id } })) }" />
        </label>
      </v-btn>
    </div>

    <div class="filters">
      <v-text-field
        v-model="search"
        density="comfortable"
        variant="solo-filled"
        placeholder="Search documents…"
        prepend-inner-icon="mdi-magnify"
        hide-details
        flat
        rounded="lg"
        class="search"
      />
      <v-btn-toggle
        v-model="statusFilter"
        density="comfortable"
        mandatory
        color="primary"
        variant="outlined"
      >
        <v-btn value="all" size="small">All</v-btn>
        <v-btn value="draft" size="small">Draft</v-btn>
        <v-btn value="signed" size="small">Signed</v-btn>
      </v-btn-toggle>
    </div>

    <div v-if="docs.documents.length === 0" class="empty-wrap">
      <PdfDropZone />
    </div>

    <div v-else-if="filtered.length === 0" class="empty">
      <v-icon icon="mdi-magnify-close" size="48" />
      <p>No documents match your filters.</p>
    </div>

    <div v-else class="doc-grid">
      <DocumentCard
        v-for="doc in filtered"
        :key="doc.id"
        :document="doc"
        @open="router.push({ name: 'editor', params: { id: doc.id } })"
        @sign="router.push({ name: 'sign', params: { id: doc.id } })"
        @duplicate="docs.duplicate(doc.id)"
        @remove="docs.remove(doc.id)"
        @download="downloadSignedPdf(doc)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.documents { display: flex; flex-direction: column; gap: 20px; }
.head-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.01em; margin: 0; }
.page-sub { font-size: 13.5px; color: rgb(var(--v-theme-on-surface-variant)); margin: 4px 0 0; }
.upload-label { cursor: pointer; }
.hidden-input { display: none; }
.filters { display: flex; align-items: center; gap: 12px; }
.search { max-width: 360px; }
.doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.empty-wrap { padding-top: 12px; }
.empty {
  padding: 80px 20px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
  p { margin: 12px 0 0; }
}
</style>
