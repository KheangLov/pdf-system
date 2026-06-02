<script setup lang="ts">
import { ref } from 'vue'
import dayjs from 'dayjs'
import SignatureModal from '@/components/signature/SignatureModal.vue'
import { useSignatureStore, useUIStore } from '@/stores'

const sigs = useSignatureStore()
const ui = useUIStore()
const modalOpen = ref(false)

function onSelected() {
  ui.pushToast('Signature saved', 'success')
}
</script>

<template>
  <div class="signatures">
    <div class="head-row">
      <div>
        <h1 class="page-title">My signatures</h1>
        <p class="page-sub">Signatures are saved locally to your browser</p>
      </div>
      <div class="head-actions">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-draw-pen" @click="modalOpen = true">New signature</v-btn>
      </div>
    </div>

    <section class="block">
      <h2 class="block-title">Signatures ({{ sigs.signatures.length }})</h2>
      <div v-if="sigs.signatures.length === 0" class="empty">
        <v-icon icon="mdi-draw-pen" size="40" />
        <p>No saved signatures. Create one to reuse it across documents.</p>
      </div>
      <div v-else class="sig-grid">
        <article v-for="s in sigs.signatures" :key="s.id" class="sig-card">
          <div class="sig-thumb"><img :src="s.dataUrl" alt="" /></div>
          <div class="sig-meta">
            <div class="sig-name">{{ s.name }}</div>
            <div class="sig-sub">
              <v-chip size="x-small" :color="s.type === 'draw' ? 'primary' : s.type === 'type' ? 'secondary' : 'accent'" variant="tonal">
                {{ s.type }}
              </v-chip>
              <span class="sig-date">{{ dayjs(s.createdAt).format('MMM D, YYYY') }}</span>
            </div>
          </div>
          <div class="sig-actions">
            <v-btn
              size="x-small"
              :variant="s.isDefault ? 'flat' : 'text'"
              :color="s.isDefault ? 'primary' : undefined"
              prepend-icon="mdi-star"
              @click="sigs.setDefault(s.id)"
            >{{ s.isDefault ? 'Default' : 'Set default' }}</v-btn>
            <v-btn size="x-small" variant="text" color="error" icon="mdi-trash-can-outline" @click="sigs.remove(s.id)" />
          </div>
        </article>
      </div>
    </section>

    <SignatureModal v-model="modalOpen" @select="onSelected" />
  </div>
</template>

<style scoped lang="scss">
.signatures { display: flex; flex-direction: column; gap: 24px; }
.head-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.head-actions { display: flex; gap: 8px; }
.page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.01em; margin: 0; }
.page-sub { font-size: 13.5px; color: rgb(var(--v-theme-on-surface-variant)); margin: 4px 0 0; }

.block { display: flex; flex-direction: column; gap: 12px; }
.block-title { font-size: 13px; font-weight: 600; color: rgb(var(--v-theme-on-surface-variant)); text-transform: uppercase; letter-spacing: 0.06em; margin: 0; }

.sig-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.sig-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 12px;
  transition: all 0.2s var(--ws-easing);
  &:hover { border-color: rgb(var(--v-theme-primary)); }
}
.sig-thumb {
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    repeating-linear-gradient(45deg, rgba(99,102,241,0.04) 0 6px, transparent 6px 12px),
    #fff;
  border-radius: 8px;
  img { max-width: 90%; max-height: 80px; object-fit: contain; }
}
.sig-meta { display: flex; flex-direction: column; gap: 4px; }
.sig-name { font-weight: 600; font-size: 13.5px; }
.sig-sub {
  font-size: 11.5px;
  color: rgb(var(--v-theme-on-surface-variant));
  display: flex; gap: 6px; align-items: center;
}
.sig-date { font-size: 11.5px; }
.sig-actions { display: flex; align-items: center; justify-content: space-between; gap: 4px; }

.empty {
  padding: 36px 20px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
  background: rgb(var(--v-theme-surface));
  border: 1px dashed rgb(var(--v-theme-border));
  border-radius: 12px;
  p { margin: 8px 0 0; font-size: 13px; }
}
</style>
