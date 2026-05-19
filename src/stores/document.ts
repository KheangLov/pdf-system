import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuid } from 'uuid'
import type { SignDocument } from '@/types'
import { documentsRepo } from '@/services/storage/db'
import { loadPdfFromData, renderThumbnail, fileToArrayBuffer } from '@/services/pdf/loader'

export const useDocumentStore = defineStore('document', () => {
  const documents = ref<SignDocument[]>([])
  const isLoading = ref(false)

  const draftDocuments = computed(() => documents.value.filter((d) => d.status === 'draft'))
  const signedDocuments = computed(() => documents.value.filter((d) => d.status === 'signed'))

  async function hydrate() {
    isLoading.value = true
    try {
      documents.value = await documentsRepo.list()
    } finally {
      isLoading.value = false
    }
  }

  async function importPdf(file: File): Promise<SignDocument> {
    const buffer = await fileToArrayBuffer(file)
    const loaded = await loadPdfFromData(buffer)
    const thumb = await renderThumbnail(loaded.document, 1, 320)
    const doc: SignDocument = {
      id: uuid(),
      name: file.name,
      size: file.size,
      pageCount: loaded.pageCount,
      pages: loaded.pages,
      pdfData: buffer,
      thumbnail: thumb,
      fields: [],
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await documentsRepo.put(doc)
    documents.value = [doc, ...documents.value]
    return doc
  }

  async function getById(id: string): Promise<SignDocument | undefined> {
    const local = documents.value.find((d) => d.id === id)
    if (local) return local
    const fromDb = await documentsRepo.get(id)
    if (fromDb && !documents.value.find((d) => d.id === id)) {
      documents.value.unshift(fromDb)
    }
    return fromDb
  }

  async function save(doc: SignDocument) {
    await documentsRepo.put(doc)
    const idx = documents.value.findIndex((d) => d.id === doc.id)
    if (idx >= 0) documents.value[idx] = { ...doc, updatedAt: Date.now() }
    else documents.value.unshift({ ...doc, updatedAt: Date.now() })
  }

  async function remove(id: string) {
    await documentsRepo.remove(id)
    documents.value = documents.value.filter((d) => d.id !== id)
  }

  async function duplicate(id: string): Promise<SignDocument | null> {
    const orig = await getById(id)
    if (!orig) return null
    const copy: SignDocument = {
      ...orig,
      id: uuid(),
      name: orig.name.replace(/(\.pdf)?$/i, ' (copy)$1'),
      pdfData: orig.pdfData.slice(0),
      fields: orig.fields.map((f) => ({ ...f, id: uuid() })),
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      signedAt: undefined
    }
    await save(copy)
    return copy
  }

  return {
    documents, draftDocuments, signedDocuments, isLoading,
    hydrate, importPdf, getById, save, remove, duplicate
  }
})
