import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuid } from 'uuid'
import type { SavedSignature } from '@/types'
import { signaturesRepo } from '@/services/storage/db'

export const useSignatureStore = defineStore('signature', () => {
  const signatures = ref<SavedSignature[]>([])
  const initials = ref<SavedSignature[]>([])

  const defaultSignature = computed(() =>
    signatures.value.find((s) => s.isDefault) ?? signatures.value[0] ?? null
  )

  async function hydrate() {
    const all = await signaturesRepo.list()
    signatures.value = all.filter((s) => !s.name.startsWith('Initials:'))
    initials.value = all.filter((s) => s.name.startsWith('Initials:'))
  }

  async function save(input: Omit<SavedSignature, 'id' | 'createdAt'>): Promise<SavedSignature> {
    const sig: SavedSignature = { ...input, id: uuid(), createdAt: Date.now() }
    await signaturesRepo.put(sig)
    if (sig.name.startsWith('Initials:')) initials.value = [sig, ...initials.value]
    else signatures.value = [sig, ...signatures.value]
    return sig
  }

  async function remove(id: string) {
    await signaturesRepo.remove(id)
    signatures.value = signatures.value.filter((s) => s.id !== id)
    initials.value = initials.value.filter((s) => s.id !== id)
  }

  async function setDefault(id: string) {
    for (const s of signatures.value) {
      const next: SavedSignature = { ...s, isDefault: s.id === id }
      await signaturesRepo.put(next)
    }
    signatures.value = signatures.value.map((s) => ({ ...s, isDefault: s.id === id }))
  }

  return { signatures, initials, defaultSignature, hydrate, save, remove, setDefault }
})
