import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import { v4 as uuid } from 'uuid'
import { cloneDeep } from 'lodash-es'
import type { SignDocument, SignField, FieldType, FieldPosition } from '@/types'
import { FIELD_CATALOG } from '@/constants/fields'
import { useDocumentStore } from './document'
import { useHistoryStore } from './history'

export const useEditorStore = defineStore('editor', () => {
  /* shallowRef is intentional — the pdfData ArrayBuffer must NOT be wrapped
   * in a reactive Proxy (it can't be cloned for IndexedDB if it is).
   * Every mutation below reassigns document.value to a new object reference
   * so Vue's reactivity fires; mutating document.value.fields in place would
   * be invisible to consumers. */
  const document = shallowRef<SignDocument | null>(null)
  const selectedIds = ref<Set<string>>(new Set())
  const hoveredId = ref<string | null>(null)
  const draggingId = ref<string | null>(null)
  const zoom = ref(1)
  const currentPage = ref(1)
  const isSaving = ref(false)
  const lastSavedAt = ref<number | null>(null)
  const mode = ref<'prepare' | 'preview'>('prepare')

  const fields = computed(() => document.value?.fields ?? [])
  const fieldsByPage = computed(() => {
    const map = new Map<number, SignField[]>()
    for (const f of fields.value) {
      if (!map.has(f.position.page)) map.set(f.position.page, [])
      map.get(f.position.page)!.push(f)
    }
    return map
  })
  const selectedFields = computed(() =>
    fields.value.filter((f) => selectedIds.value.has(f.id))
  )
  const primarySelection = computed<SignField | null>(() =>
    selectedFields.value[0] ?? null
  )

  function replaceFields(nextFields: SignField[]) {
    if (!document.value) return
    document.value = { ...document.value, fields: nextFields }
  }

  function setDocument(doc: SignDocument | null) {
    document.value = doc ? { ...doc, fields: cloneDeep(doc.fields) } : null
    selectedIds.value = new Set()
    currentPage.value = 1
    if (doc) useHistoryStore().reset(doc.fields)
  }

  function setZoom(level: number) {
    zoom.value = Math.max(0.4, Math.min(3, level))
  }
  function zoomIn() { setZoom(zoom.value + 0.1) }
  function zoomOut() { setZoom(zoom.value - 0.1) }
  function resetZoom() { setZoom(1) }

  function selectField(id: string, additive = false) {
    /* Release any active text input so the next keyboard Delete targets the
     * field rather than the input character. (Use window.document explicitly
     * — `document` is shadowed by the local shallowRef above.) */
    const focused = window.document?.activeElement as HTMLElement | null
    if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA' || focused.isContentEditable)) {
      focused.blur()
    }
    if (additive) {
      const next = new Set(selectedIds.value)
      next.has(id) ? next.delete(id) : next.add(id)
      selectedIds.value = next
    } else {
      selectedIds.value = new Set([id])
    }
  }
  function selectMany(ids: string[]) { selectedIds.value = new Set(ids) }
  function clearSelection() { selectedIds.value = new Set() }

  function addField(type: FieldType, position: FieldPosition): SignField {
    if (!document.value) throw new Error('No document loaded')
    const meta = FIELD_CATALOG[type]
    const field: SignField = {
      id: uuid(),
      type,
      position,
      label: meta.label,
      placeholder: meta.label,
      required: true,
      locked: false,
      style: {
        color: '#0f172a',
        background: meta.color + '14',
        borderColor: meta.color,
        borderWidth: 1,
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
        align: 'left',
        radius: 4
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...(type === 'api' && {
        apiBinding: { url: '', method: 'GET' as const, cacheSeconds: 60 }
      })
    }
    replaceFields([...fields.value, field])
    selectField(field.id)
    pushHistory(`Added ${meta.label}`)
    return field
  }

  function updateField(id: string, patch: Partial<SignField>) {
    replaceFields(fields.value.map((f) =>
      f.id === id ? { ...f, ...patch, updatedAt: Date.now() } : f
    ))
  }

  function updatePosition(id: string, position: Partial<FieldPosition>) {
    replaceFields(fields.value.map((f) =>
      f.id === id
        ? { ...f, position: { ...f.position, ...position }, updatedAt: Date.now() }
        : f
    ))
  }

  /* Atomic group translate — move every selected field by (dx, dy) in
   * normalised page-relative units. Used by group drag and arrow nudge so
   * the whole selection moves in a single reactive update. The leader id
   * lets the caller include a field that isn't selected yet (drag-from-deselect
   * gracefully promotes to a single-field move). Movement is clamped per
   * field so any one of them hitting the edge doesn't stall the rest. */
  function moveSelection(leaderId: string, dx: number, dy: number) {
    if (!document.value) return
    const ids = selectedIds.value.has(leaderId)
      ? new Set(selectedIds.value)
      : new Set([leaderId])
    if (!ids.size) return
    replaceFields(fields.value.map((f) => {
      if (!ids.has(f.id)) return f
      const newX = Math.max(0, Math.min(1 - f.position.width, f.position.x + dx))
      const newY = Math.max(0, Math.min(1 - f.position.height, f.position.y + dy))
      return { ...f, position: { ...f.position, x: newX, y: newY }, updatedAt: Date.now() }
    }))
  }

  function nudgeSelection(dx: number, dy: number) {
    if (selectedIds.value.size === 0) return
    moveSelection([...selectedIds.value][0], dx, dy)
    pushHistory('Nudged field')
  }

  function commitUpdate(label: string) { pushHistory(label) }

  function duplicateSelection() {
    if (!document.value || selectedIds.value.size === 0) return
    const copies: SignField[] = []
    const newIds = new Set<string>()
    for (const f of selectedFields.value) {
      const copy: SignField = {
        ...cloneDeep(f),
        id: uuid(),
        position: {
          ...f.position,
          x: Math.min(0.98 - f.position.width, f.position.x + 0.02),
          y: Math.min(0.98 - f.position.height, f.position.y + 0.02)
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      copies.push(copy)
      newIds.add(copy.id)
    }
    replaceFields([...fields.value, ...copies])
    selectedIds.value = newIds
    pushHistory(`Duplicated ${copies.length} field(s)`)
  }

  function deleteSelection() {
    if (!document.value || selectedIds.value.size === 0) return
    const count = selectedIds.value.size
    replaceFields(fields.value.filter((f) => !selectedIds.value.has(f.id)))
    clearSelection()
    pushHistory(`Deleted ${count} field(s)`)
  }

  function toggleRequiredSelection() {
    if (!document.value) return
    const allRequired = selectedFields.value.every((f) => f.required)
    replaceFields(fields.value.map((f) =>
      selectedIds.value.has(f.id) ? { ...f, required: !allRequired } : f
    ))
    pushHistory('Toggled required')
  }

  function toggleLockSelection() {
    if (!document.value) return
    const allLocked = selectedFields.value.every((f) => f.locked)
    replaceFields(fields.value.map((f) =>
      selectedIds.value.has(f.id) ? { ...f, locked: !allLocked } : f
    ))
    pushHistory('Toggled lock')
  }

  function pushHistory(label: string) {
    if (!document.value) return
    useHistoryStore().push(label, document.value.fields)
  }

  function restoreFields(snapshot: SignField[]) {
    replaceFields(cloneDeep(snapshot))
    selectedIds.value = new Set()
  }

  async function persist() {
    if (!document.value) return
    isSaving.value = true
    try {
      await useDocumentStore().save(document.value)
      lastSavedAt.value = Date.now()
    } finally {
      isSaving.value = false
    }
  }

  function reset() {
    document.value = null
    selectedIds.value = new Set()
    zoom.value = 1
    currentPage.value = 1
    lastSavedAt.value = null
    useHistoryStore().reset([])
  }

  return {
    document, fields, fieldsByPage, selectedIds, selectedFields, primarySelection,
    hoveredId, draggingId, zoom, currentPage, isSaving, lastSavedAt, mode,
    setDocument, setZoom, zoomIn, zoomOut, resetZoom,
    selectField, selectMany, clearSelection,
    addField, updateField, updatePosition, moveSelection, nudgeSelection, commitUpdate,
    duplicateSelection, deleteSelection, toggleRequiredSelection, toggleLockSelection,
    restoreFields, persist, reset
  }
})
