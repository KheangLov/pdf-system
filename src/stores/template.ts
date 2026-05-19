import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuid } from 'uuid'
import { cloneDeep } from 'lodash-es'
import type { SignTemplate, SignDocument } from '@/types'
import { templatesRepo } from '@/services/storage/db'

export const useTemplateStore = defineStore('template', () => {
  const templates = ref<SignTemplate[]>([])
  const isLoading = ref(false)

  const categories = computed(() => {
    const set = new Set<string>()
    templates.value.forEach((t) => t.category && set.add(t.category))
    return Array.from(set).sort()
  })

  const recent = computed(() =>
    [...templates.value].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6)
  )

  async function hydrate() {
    isLoading.value = true
    try { templates.value = await templatesRepo.list() }
    finally { isLoading.value = false }
  }

  async function createFromDocument(doc: SignDocument, meta: { name: string; description?: string; category?: string }): Promise<SignTemplate> {
    const tpl: SignTemplate = {
      id: uuid(),
      name: meta.name,
      description: meta.description,
      category: meta.category,
      baseDocumentName: doc.name,
      pdfData: doc.pdfData.slice(0),
      pageCount: doc.pageCount,
      pages: cloneDeep(doc.pages),
      fields: cloneDeep(doc.fields),
      thumbnail: doc.thumbnail,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      useCount: 0
    }
    await templatesRepo.put(tpl)
    templates.value = [tpl, ...templates.value]
    return tpl
  }

  async function save(tpl: SignTemplate) {
    await templatesRepo.put(tpl)
    const idx = templates.value.findIndex((t) => t.id === tpl.id)
    if (idx >= 0) templates.value[idx] = { ...tpl, updatedAt: Date.now() }
    else templates.value.unshift({ ...tpl, updatedAt: Date.now() })
  }

  async function remove(id: string) {
    await templatesRepo.remove(id)
    templates.value = templates.value.filter((t) => t.id !== id)
  }

  async function duplicate(id: string): Promise<SignTemplate | null> {
    const orig = templates.value.find((t) => t.id === id)
    if (!orig) return null
    const copy: SignTemplate = {
      ...cloneDeep(orig),
      id: uuid(),
      name: orig.name + ' (copy)',
      pdfData: orig.pdfData.slice(0),
      useCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await save(copy)
    return copy
  }

  function get(id: string): SignTemplate | undefined {
    return templates.value.find((t) => t.id === id)
  }

  async function instantiate(id: string): Promise<SignDocument | null> {
    const tpl = get(id) ?? await templatesRepo.get(id)
    if (!tpl) return null
    tpl.useCount += 1
    await templatesRepo.put(tpl)
    const idx = templates.value.findIndex((t) => t.id === id)
    if (idx >= 0) templates.value[idx] = tpl
    const doc: SignDocument = {
      id: uuid(),
      name: tpl.baseDocumentName,
      size: tpl.pdfData.byteLength,
      pageCount: tpl.pageCount,
      pages: cloneDeep(tpl.pages),
      pdfData: tpl.pdfData.slice(0),
      thumbnail: tpl.thumbnail,
      fields: cloneDeep(tpl.fields).map((f) => ({ ...f, id: uuid() })),
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    return doc
  }

  return {
    templates, categories, recent, isLoading,
    hydrate, createFromDocument, save, remove, duplicate, get, instantiate
  }
})
