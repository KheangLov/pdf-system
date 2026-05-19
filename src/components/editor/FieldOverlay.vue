<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import type { SignField } from '@/types'
import { FIELD_CATALOG } from '@/constants/fields'
import { useEditorStore } from '@/stores'
import { useFieldInteractions } from '@/composables/useFieldInteractions'

const props = defineProps<{
  field: SignField
  pageWidth: number
  pageHeight: number
}>()

const editor = useEditorStore()
const root = ref<HTMLDivElement | null>(null)

const isSelected = computed(() => editor.selectedIds.has(props.field.id))
const meta = computed(() => FIELD_CATALOG[props.field.type])

const positionStyle = computed(() => ({
  left: `${props.field.position.x * props.pageWidth}px`,
  top: `${props.field.position.y * props.pageHeight}px`,
  width: `${props.field.position.width * props.pageWidth}px`,
  height: `${props.field.position.height * props.pageHeight}px`,
  borderColor: props.field.style?.borderColor ?? meta.value.color,
  background: props.field.style?.background ?? meta.value.color + '14'
}))

useFieldInteractions(root, {
  field: props.field,
  pageWidth: toRef(props, 'pageWidth'),
  pageHeight: toRef(props, 'pageHeight')
})

function onSelect(e: MouseEvent) {
  e.stopPropagation()
  editor.selectField(props.field.id, e.shiftKey)
}
</script>

<template>
  <div
    ref="root"
    class="field-overlay"
    :class="{
      'is-selected': isSelected,
      'is-locked': field.locked,
      'is-required': field.required
    }"
    :style="positionStyle"
    @mousedown="onSelect"
    @touchstart.passive="onSelect($event as unknown as MouseEvent)"
  >
    <div class="field-content">
      <v-icon :icon="meta.icon" size="14" class="field-icon" />
      <span class="field-label">{{ field.label ?? meta.label }}</span>
    </div>

    <template v-if="isSelected && !field.locked">
      <span class="field-handle nw" />
      <span class="field-handle ne" />
      <span class="field-handle sw" />
      <span class="field-handle se" />
    </template>

    <div v-if="isSelected" class="field-badge">
      <v-icon :icon="meta.icon" size="12" />
      <span>{{ meta.label }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.field-content {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  padding: 0 6px;
  overflow: hidden;
  font-weight: 500;
}
.field-icon { opacity: 0.7; flex-shrink: 0; }
.field-label {
  font-size: 11px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.field-badge {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgb(99, 102, 241);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
  box-shadow: var(--ws-shadow-sm);
  pointer-events: none;
  z-index: 3;
}
</style>
