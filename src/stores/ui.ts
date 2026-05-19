import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { nanoid } from 'nanoid'
import { useTheme } from 'vuetify'
import type { Toast, UIPreferences } from '@/types'
import { preferencesRepo } from '@/services/storage/db'

const DEFAULT_PREFERENCES: UIPreferences = {
  theme: 'light',
  primaryColor: '#6366f1',
  showGrid: false,
  snapToGrid: true,
  gridSize: 8,
  autoSave: true,
  showRulers: false,
  density: 'comfortable'
}

export const useUIStore = defineStore('ui', () => {
  const preferences = ref<UIPreferences>({ ...DEFAULT_PREFERENCES })
  const toasts = ref<Toast[]>([])
  const isLoading = ref(false)
  const commandPaletteOpen = ref(false)
  const mobileNavOpen = ref(false)

  let themeApi: ReturnType<typeof useTheme> | null = null
  function attachTheme(api: ReturnType<typeof useTheme>) {
    themeApi = api
    applyTheme()
  }

  function applyTheme() {
    if (themeApi) themeApi.global.name.value = preferences.value.theme
    document.documentElement.dataset.theme = preferences.value.theme
  }

  async function hydrate() {
    const saved = await preferencesRepo.get()
    if (saved) preferences.value = { ...DEFAULT_PREFERENCES, ...saved }
    applyTheme()
  }

  function updatePreferences(patch: Partial<UIPreferences>) {
    preferences.value = { ...preferences.value, ...patch }
  }

  function toggleTheme() {
    preferences.value.theme = preferences.value.theme === 'light' ? 'dark' : 'light'
  }

  function pushToast(message: string, type: Toast['type'] = 'info', duration = 3200) {
    const toast: Toast = { id: nanoid(), message, type, duration }
    toasts.value.push(toast)
    setTimeout(() => dismissToast(toast.id), duration)
    return toast.id
  }

  function dismissToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  watch(preferences, (val) => {
    preferencesRepo.put(val).catch(console.error)
    applyTheme()
  }, { deep: true })

  return {
    preferences,
    toasts,
    isLoading,
    commandPaletteOpen,
    mobileNavOpen,
    hydrate,
    attachTheme,
    updatePreferences,
    toggleTheme,
    pushToast,
    dismissToast
  }
})
