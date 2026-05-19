import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cloneDeep } from 'lodash-es'
import { v4 as uuid } from 'uuid'
import type { HistoryEntry, SignField } from '@/types'

const MAX_HISTORY = 60

export const useHistoryStore = defineStore('history', () => {
  const stack = ref<HistoryEntry[]>([])
  const cursor = ref(-1)

  const canUndo = computed(() => cursor.value > 0)
  const canRedo = computed(() => cursor.value < stack.value.length - 1)
  const currentLabel = computed(() => stack.value[cursor.value]?.label ?? null)

  function reset(snapshot: SignField[]) {
    stack.value = [{
      id: uuid(),
      label: 'Initial state',
      timestamp: Date.now(),
      snapshot: cloneDeep(snapshot)
    }]
    cursor.value = 0
  }

  function push(label: string, snapshot: SignField[]) {
    const trimmed = stack.value.slice(0, cursor.value + 1)
    trimmed.push({
      id: uuid(),
      label,
      timestamp: Date.now(),
      snapshot: cloneDeep(snapshot)
    })
    while (trimmed.length > MAX_HISTORY) trimmed.shift()
    stack.value = trimmed
    cursor.value = trimmed.length - 1
  }

  function undo(): SignField[] | null {
    if (!canUndo.value) return null
    cursor.value -= 1
    return cloneDeep(stack.value[cursor.value].snapshot)
  }

  function redo(): SignField[] | null {
    if (!canRedo.value) return null
    cursor.value += 1
    return cloneDeep(stack.value[cursor.value].snapshot)
  }

  return { stack, cursor, canUndo, canRedo, currentLabel, reset, push, undo, redo }
})
