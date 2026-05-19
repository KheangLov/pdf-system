<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from 'vuetify'
import AppShell from '@/components/layout/AppShell.vue'
import ToastContainer from '@/components/feedback/ToastContainer.vue'
import { useUIStore, useDocumentStore, useSignatureStore, useTemplateStore } from '@/stores'

const route = useRoute()
const ui = useUIStore()
const theme = useTheme()

onMounted(async () => {
  ui.attachTheme(theme)
  await Promise.all([
    ui.hydrate(),
    useDocumentStore().hydrate(),
    useSignatureStore().hydrate(),
    useTemplateStore().hydrate()
  ])
})
</script>

<template>
  <v-app>
    <AppShell v-if="!route.meta.fullscreen">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </AppShell>
    <router-view v-else />
    <ToastContainer />
  </v-app>
</template>
