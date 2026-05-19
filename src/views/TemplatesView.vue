<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useTemplateStore, useDocumentStore, useUIStore } from '@/stores'

const router = useRouter()
const templates = useTemplateStore()
const docs = useDocumentStore()
const ui = useUIStore()

const search = ref('')
const selectedCategory = ref<string>('all')

const filtered = computed(() => {
  let list = templates.templates
  if (selectedCategory.value !== 'all') {
    list = list.filter((t) => t.category === selectedCategory.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((t) => t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))
  }
  return list
})

async function useTemplate(id: string) {
  const doc = await templates.instantiate(id)
  if (!doc) return
  await docs.save(doc)
  ui.pushToast('Document created from template', 'success')
  router.push({ name: 'editor', params: { id: doc.id } })
}
</script>

<template>
  <div class="templates">
    <div class="head-row">
      <div>
        <h1 class="page-title">Templates</h1>
        <p class="page-sub">Reusable signing setups — open the editor to save any document as a template</p>
      </div>
    </div>

    <div class="filters">
      <v-text-field
        v-model="search"
        density="comfortable"
        variant="solo-filled"
        placeholder="Search templates…"
        prepend-inner-icon="mdi-magnify"
        hide-details
        flat
        rounded="lg"
        class="search"
      />
      <v-chip-group v-model="selectedCategory" mandatory color="primary">
        <v-chip value="all">All</v-chip>
        <v-chip v-for="c in templates.categories" :key="c" :value="c">{{ c }}</v-chip>
      </v-chip-group>
    </div>

    <div v-if="templates.templates.length === 0" class="empty">
      <v-icon icon="mdi-file-replace-outline" size="56" />
      <h3>No templates yet</h3>
      <p>Open a document in the editor, then click "Save template" to make it reusable.</p>
      <v-btn color="primary" variant="flat" class="mt-3" prepend-icon="mdi-arrow-right" @click="router.push('/documents')">
        Go to documents
      </v-btn>
    </div>

    <div v-else class="template-grid">
      <article v-for="tpl in filtered" :key="tpl.id" class="template-card">
        <div class="template-thumb">
          <img v-if="tpl.thumbnail" :src="tpl.thumbnail" alt="" />
          <v-icon v-else icon="mdi-file-replace-outline" size="48" />
        </div>
        <div class="template-body">
          <div class="template-head">
            <h3>{{ tpl.name }}</h3>
            <v-chip v-if="tpl.category" size="x-small" variant="tonal" color="primary">{{ tpl.category }}</v-chip>
          </div>
          <p v-if="tpl.description" class="template-desc">{{ tpl.description }}</p>
          <div class="template-meta">
            <span><v-icon icon="mdi-file-document-outline" size="13" /> {{ tpl.pageCount }} pages</span>
            <span><v-icon icon="mdi-vector-square" size="13" /> {{ tpl.fields.length }} fields</span>
            <span><v-icon icon="mdi-update" size="13" /> {{ dayjs(tpl.updatedAt).format('MMM D') }}</span>
            <span><v-icon icon="mdi-restart" size="13" /> {{ tpl.useCount }} uses</span>
          </div>
          <div class="template-actions">
            <v-btn color="primary" variant="flat" size="small" prepend-icon="mdi-plus" @click="useTemplate(tpl.id)">
              Use template
            </v-btn>
            <v-btn variant="text" size="small" icon="mdi-content-copy" @click="templates.duplicate(tpl.id)" />
            <v-btn variant="text" size="small" icon="mdi-trash-can-outline" color="error" @click="templates.remove(tpl.id)" />
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped lang="scss">
.templates { display: flex; flex-direction: column; gap: 20px; }
.head-row { display: flex; align-items: flex-end; justify-content: space-between; }
.page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.01em; margin: 0; }
.page-sub { font-size: 13.5px; color: rgb(var(--v-theme-on-surface-variant)); margin: 4px 0 0; }

.filters { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.search { max-width: 360px; }

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.template-card {
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.2s var(--ws-easing);
  &:hover {
    border-color: rgb(var(--v-theme-primary));
    box-shadow: var(--ws-shadow-md);
    transform: translateY(-1px);
  }
}
.template-thumb {
  aspect-ratio: 16 / 10;
  background: rgb(var(--v-theme-surface-variant));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
}
.template-body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.template-head { display: flex; align-items: center; justify-content: space-between; gap: 8px;
  h3 { font-size: 14px; font-weight: 600; margin: 0; }
}
.template-desc {
  font-size: 12.5px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.template-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 11.5px;
  color: rgb(var(--v-theme-on-surface-variant));
  span { display: inline-flex; align-items: center; gap: 4px; }
}
.template-actions { display: flex; align-items: center; gap: 6px; margin-top: 2px; }

.empty {
  padding: 80px 20px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
  h3 { font-size: 16px; margin: 12px 0 6px; color: rgb(var(--v-theme-on-surface)); }
  p { margin: 0; }
}
</style>
