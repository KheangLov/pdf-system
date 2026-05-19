<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import type { SignDocument } from '@/types'

const props = defineProps<{ document: SignDocument }>()
defineEmits<{
  (e: 'open'): void
  (e: 'sign'): void
  (e: 'duplicate'): void
  (e: 'remove'): void
  (e: 'download'): void
}>()

const statusColor: Record<string, string> = {
  draft: 'info',
  ready: 'warning',
  signed: 'success',
  archived: 'default'
}

const updatedLabel = computed(() => dayjs(props.document.updatedAt).format('MMM D, HH:mm'))
const fieldCount = computed(() => props.document.fields.length)
</script>

<template>
  <article class="doc-card" @click="$emit('open')">
    <div class="doc-card-thumb">
      <img v-if="document.thumbnail" :src="document.thumbnail" alt="" />
      <v-icon v-else icon="mdi-file-pdf-box" size="56" />
      <div class="doc-card-overlay">
        <v-btn variant="flat" color="primary" prepend-icon="mdi-cursor-default-click" size="small" @click.stop="$emit('open')">Open</v-btn>
        <v-btn variant="tonal" color="white" prepend-icon="mdi-draw-pen" size="small" @click.stop="$emit('sign')">Sign</v-btn>
      </div>
    </div>
    <div class="doc-card-body">
      <div class="doc-card-head">
        <span class="doc-card-name" :title="document.name">{{ document.name }}</span>
        <v-chip
          :color="statusColor[document.status]"
          size="x-small"
          variant="tonal"
          class="font-weight-medium"
        >
          {{ document.status }}
        </v-chip>
      </div>
      <div class="doc-card-meta">
        <span>
          <v-icon icon="mdi-file-document-outline" size="13" />
          {{ document.pageCount }} pages
        </span>
        <span>
          <v-icon icon="mdi-vector-square" size="13" />
          {{ fieldCount }} field{{ fieldCount === 1 ? '' : 's' }}
        </span>
        <span>
          <v-icon icon="mdi-clock-outline" size="13" />
          {{ updatedLabel }}
        </span>
      </div>
    </div>
    <v-menu>
      <template #activator="{ props: menuProps }">
        <v-btn icon="mdi-dots-vertical" size="small" variant="text" class="doc-card-menu" v-bind="menuProps" @click.stop />
      </template>
      <v-list density="compact">
        <v-list-item prepend-icon="mdi-pencil-outline" title="Open in editor" @click="$emit('open')" />
        <v-list-item prepend-icon="mdi-draw-pen" title="Sign" @click="$emit('sign')" />
        <v-list-item prepend-icon="mdi-content-copy" title="Duplicate" @click="$emit('duplicate')" />
        <v-list-item prepend-icon="mdi-download-outline" title="Download" @click="$emit('download')" />
        <v-divider />
        <v-list-item prepend-icon="mdi-trash-can-outline" title="Delete" base-color="error" @click="$emit('remove')" />
      </v-list>
    </v-menu>
  </article>
</template>

<style scoped lang="scss">
.doc-card {
  position: relative;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.2s var(--ws-easing);
  cursor: pointer;
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--ws-shadow-lg);
    border-color: rgb(var(--v-theme-primary));
    .doc-card-overlay { opacity: 1; }
  }
}
.doc-card-thumb {
  position: relative;
  aspect-ratio: 4 / 5;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-surface-variant));
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
}
.doc-card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(180deg, rgba(15,23,42,0.0) 30%, rgba(15,23,42,0.6) 100%);
  opacity: 0;
  transition: opacity 0.2s var(--ws-easing);
}
.doc-card-body { padding: 12px 14px 14px; }
.doc-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.doc-card-name {
  font-weight: 600;
  font-size: 13.5px;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.doc-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 11.5px;
  color: rgb(var(--v-theme-on-surface-variant));
  span { display: inline-flex; align-items: center; gap: 4px; }
}
.doc-card-menu {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255,255,255,0.85) !important;
  backdrop-filter: blur(8px);
  opacity: 0;
  transition: opacity 0.2s var(--ws-easing);
}
.doc-card:hover .doc-card-menu { opacity: 1; }
</style>
