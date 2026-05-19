<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useRouter, useRoute } from 'vue-router'
import { useUIStore } from '@/stores'

const router = useRouter()
const route = useRoute()
const display = useDisplay()
const ui = useUIStore()

const drawer = ref(true)
const isMobile = computed(() => display.mdAndDown.value)

const navItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', to: '/' },
  { title: 'Documents', icon: 'mdi-file-document-multiple-outline', to: '/documents' },
  { title: 'Templates', icon: 'mdi-file-replace-outline', to: '/templates' },
  { title: 'Signatures', icon: 'mdi-draw-pen', to: '/signatures' },
  { title: 'Settings', icon: 'mdi-cog-outline', to: '/settings' }
]
</script>

<template>
  <v-navigation-drawer
    v-model="drawer"
    :rail="isMobile"
    :permanent="!isMobile"
    width="260"
    elevation="0"
    color="surface"
    class="ws-sidebar"
  >
    <div class="brand">
      <div class="brand-mark">
        <svg viewBox="0 0 64 64" width="32" height="32" aria-hidden="true">
          <defs>
            <linearGradient id="brandG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#6366f1"/>
              <stop offset="1" stop-color="#8b5cf6"/>
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="14" fill="url(#brandG)"/>
          <path d="M14 42 C 22 18, 30 50, 38 28 S 50 38, 52 22"
            stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>
      </div>
      <div v-if="!isMobile" class="brand-text">
        <div class="brand-name">Wing Sign</div>
        <div class="brand-tag">Premium signing suite</div>
      </div>
    </div>

    <v-list nav density="comfortable" class="nav-list">
      <v-list-item
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :prepend-icon="item.icon"
        :title="item.title"
        rounded="lg"
        class="nav-item"
      />
    </v-list>

    <template #append>
      <div class="sidebar-footer">
        <v-btn
          variant="tonal"
          color="primary"
          prepend-icon="mdi-plus"
          block
          @click="router.push('/documents')"
        >
          <span v-if="!isMobile">New document</span>
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>

  <v-app-bar
    color="transparent"
    flat
    height="64"
    class="ws-appbar"
  >
    <template #prepend>
      <v-app-bar-nav-icon
        v-if="isMobile"
        @click="drawer = !drawer"
      />
    </template>

    <v-app-bar-title class="title-row">
      <span class="appbar-title">{{ route.meta.title ?? 'Wing Sign' }}</span>
    </v-app-bar-title>

    <template #append>
      <v-btn
        icon="mdi-magnify"
        variant="text"
        size="small"
        @click="ui.commandPaletteOpen = true"
      />
      <v-btn
        :icon="ui.preferences.theme === 'dark' ? 'mdi-white-balance-sunny' : 'mdi-weather-night'"
        variant="text"
        size="small"
        @click="ui.toggleTheme()"
      />
      <v-btn icon="mdi-bell-outline" variant="text" size="small" />
      <v-avatar size="34" color="primary" class="ml-2">
        <span class="text-caption text-white font-weight-bold">WS</span>
      </v-avatar>
    </template>
  </v-app-bar>

  <v-main class="ws-main">
    <div class="ws-content">
      <slot />
    </div>
  </v-main>
</template>

<style scoped lang="scss">
.ws-sidebar {
  border-right: 1px solid rgb(var(--v-theme-border)) !important;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px 8px;
}
.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--ws-shadow-sm);
}
.brand-text { line-height: 1.2; }
.brand-name { font-weight: 700; font-size: 16px; letter-spacing: -0.01em; }
.brand-tag { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); }

.nav-list { padding: 8px 12px; }
.nav-item {
  margin-bottom: 2px;
  font-weight: 500;
  font-size: 13.5px;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgb(var(--v-theme-border));
}

.ws-appbar {
  border-bottom: 1px solid rgb(var(--v-theme-border)) !important;
  backdrop-filter: blur(14px) saturate(180%);
  background: rgba(var(--v-theme-surface), 0.78) !important;
}

.appbar-title {
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.01em;
}

.ws-main {
  background: rgb(var(--v-theme-background));
}
.ws-content {
  padding: 24px;
  max-width: 1480px;
  margin: 0 auto;
}

@media (max-width: 960px) {
  .ws-content { padding: 16px; }
}
</style>
