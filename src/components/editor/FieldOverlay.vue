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
const isPreview = computed(() => editor.mode === 'preview')
const meta = computed(() => FIELD_CATALOG[props.field.type])

const positionStyle = computed(() => ({
  left: `${props.field.position.x * props.pageWidth}px`,
  top: `${props.field.position.y * props.pageHeight}px`,
  width: `${props.field.position.width * props.pageWidth}px`,
  height: `${props.field.position.height * props.pageHeight}px`,
  borderColor: props.field.style?.borderColor ?? meta.value.color,
  background: props.field.style?.background ?? meta.value.color + '14'
}))

/* Place the toolbar above the field unless the field sits near the page top. */
const toolbarPlacement = computed(() =>
  props.field.position.y * props.pageHeight < 56 ? 'below' : 'above'
)

useFieldInteractions(root, {
  field: props.field,
  pageWidth: toRef(props, 'pageWidth'),
  pageHeight: toRef(props, 'pageHeight')
})

function blurActiveInput() {
  const el = document.activeElement as HTMLElement | null
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) {
    el.blur()
  }
}

function onSelect(e: MouseEvent) {
  if (isPreview.value) return
  e.stopPropagation()
  blurActiveInput()
  editor.selectField(props.field.id, e.shiftKey)
}

function runAction(action: 'delete' | 'duplicate' | 'required' | 'lock', e: Event) {
  e.preventDefault()
  e.stopPropagation()
  if (!editor.selectedIds.has(props.field.id)) editor.selectField(props.field.id)
  if (action === 'delete') editor.deleteSelection()
  else if (action === 'duplicate') editor.duplicateSelection()
  else if (action === 'required') editor.toggleRequiredSelection()
  else if (action === 'lock') editor.toggleLockSelection()
}
</script>

<template>
  <div
    ref="root"
    class="field-overlay"
    :class="{
      'is-selected': isSelected,
      'is-locked': field.locked,
      'is-required': field.required,
      'is-preview': isPreview
    }"
    :style="positionStyle"
    @mousedown="onSelect"
    @touchstart.passive="onSelect($event as unknown as MouseEvent)"
  >
    <div class="field-content">
      <v-icon :icon="meta.icon" size="14" class="field-icon" />
      <span class="field-label">{{ field.label ?? meta.label }}</span>
    </div>

    <template v-if="isSelected && !field.locked && !isPreview">
      <span class="field-handle nw" />
      <span class="field-handle ne" />
      <span class="field-handle sw" />
      <span class="field-handle se" />
    </template>

    <Transition name="ws-pop">
      <div
        v-if="isSelected && !isPreview"
        :class="['field-toolbar', toolbarPlacement]"
        @mousedown.stop
        @click.stop
      >
        <span class="ft-label">
          <v-icon :icon="meta.icon" size="12" />
          {{ meta.label }}
        </span>
        <div class="ft-divider" />
        <button
          class="ft-btn"
          :class="{ active: field.required }"
          title="Required"
          @click="runAction('required', $event)"
        >
          <v-icon icon="mdi-asterisk" size="13" />
        </button>
        <button
          class="ft-btn"
          :class="{ active: field.locked }"
          title="Lock"
          @click="runAction('lock', $event)"
        >
          <v-icon :icon="field.locked ? 'mdi-lock' : 'mdi-lock-open-variant-outline'" size="13" />
        </button>
        <button class="ft-btn" title="Duplicate" @click="runAction('duplicate', $event)">
          <v-icon icon="mdi-content-copy" size="13" />
        </button>
        <div class="ft-divider" />
        <button class="ft-btn danger" title="Delete (Del)" @click="runAction('delete', $event)">
          <v-icon icon="mdi-trash-can-outline" size="13" />
        </button>
      </div>
    </Transition>
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
  pointer-events: none;
}
.field-icon { opacity: 0.7; flex-shrink: 0; }
.field-label {
  font-size: 11px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.field-toolbar {
  position: absolute;
  right: 0;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background: rgb(15, 23, 42);
  border-radius: 8px;
  box-shadow: var(--ws-shadow-lg);
  z-index: 5;
  white-space: nowrap;
  &.above { bottom: calc(100% + 10px); }
  &.below { top: calc(100% + 10px); }
}
.ft-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  padding: 0 8px 0 6px;
}
.ft-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  padding: 0;
  transition: background 0.12s var(--ws-easing), color 0.12s var(--ws-easing);
  &:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
  &.active { background: rgba(99, 102, 241, 0.45); color: #fff; }
  &.danger:hover { background: rgba(239, 68, 68, 0.85); color: #fff; }
}
.ft-divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.18);
  margin: 0 2px;
}

.ws-pop-enter-active, .ws-pop-leave-active {
  transition: opacity 0.14s var(--ws-easing), transform 0.18s var(--ws-easing-spring);
}
.ws-pop-enter-from, .ws-pop-leave-to {
  opacity: 0;
  transform: translateY(2px) scale(0.96);
}

/* Preview mode: read-only, no resize/move affordances. */
.field-overlay.is-preview {
  cursor: default !important;
  border-style: dashed !important;
  opacity: 0.85;
  &:hover { box-shadow: none !important; }
}
</style>
