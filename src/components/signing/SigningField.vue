<script setup lang="ts">
import { computed } from 'vue'
import type { SignField } from '@/types'
import { FIELD_CATALOG } from '@/constants/fields'
import dayjs from 'dayjs'

const props = defineProps<{
  field: SignField
  pageWidth: number
  pageHeight: number
  active: boolean
}>()
const emit = defineEmits<{
  (e: 'click'): void
  (e: 'update', value: string | boolean | null): void
}>()

const meta = computed(() => FIELD_CATALOG[props.field.type])

const positionStyle = computed(() => ({
  left: `${props.field.position.x * props.pageWidth}px`,
  top: `${props.field.position.y * props.pageHeight}px`,
  width: `${props.field.position.width * props.pageWidth}px`,
  height: `${props.field.position.height * props.pageHeight}px`
}))

const isFilled = computed(() => {
  const v = props.field.value
  if (props.field.type === 'checkbox') return v === true
  return v != null && v !== ''
})

/* Required + empty = the user still needs to act here. Worth visually shouting. */
const needsAttention = computed(() => props.field.required && !isFilled.value)

const inputType = computed(() => {
  switch (props.field.type) {
    case 'email': return 'email'
    case 'phone': return 'tel'
    case 'date': return 'date'
    default: return 'text'
  }
})

function autoFill() {
  if (props.field.type === 'date' && !props.field.value) {
    emit('update', dayjs().format('YYYY-MM-DD'))
  }
}
</script>

<template>
  <div
    class="signing-field"
    :class="{
      'is-active': active,
      'is-filled': isFilled,
      'is-required': field.required,
      'is-needs-attention': needsAttention,
      'is-image': field.type === 'signature' || field.type === 'initial'
    }"
    :style="positionStyle"
    @click="emit('click')"
  >
    <!-- Required badge — sits above the field, always visible when needed -->
    <span v-if="needsAttention" class="required-badge">
      <v-icon icon="mdi-asterisk" size="9" />
      Required
    </span>

    <!-- Filled checkmark indicator -->
    <span v-if="isFilled" class="filled-badge" aria-hidden="true">
      <v-icon icon="mdi-check" size="11" />
    </span>

    <template v-if="field.type === 'signature' || field.type === 'initial'">
      <img
        v-if="typeof field.value === 'string' && field.value.startsWith('data:image')"
        :src="field.value"
        class="signing-field-img"
        alt=""
      />
      <span v-else class="signing-field-prompt">
        <v-icon :icon="meta.icon" size="14" />
        {{ field.label ?? meta.label }}
      </span>
    </template>

    <template v-else-if="field.type === 'checkbox'">
      <label class="signing-checkbox" @click.stop>
        <input
          type="checkbox"
          :checked="field.value === true"
          @change="emit('update', ($event.target as HTMLInputElement).checked)"
        />
      </label>
    </template>

    <template v-else-if="field.type === 'selection'">
      <select
        class="signing-input"
        :value="(field.value as string) ?? ''"
        @click.stop
        @change="emit('update', ($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>{{ field.placeholder ?? 'Select…' }}</option>
        <option v-for="opt in field.options ?? []" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </template>

    <template v-else-if="field.type === 'multiline'">
      <textarea
        class="signing-input signing-textarea"
        :placeholder="field.placeholder"
        :value="(field.value as string) ?? ''"
        @click.stop
        @input="emit('update', ($event.target as HTMLTextAreaElement).value)"
      />
    </template>

    <template v-else>
      <input
        :type="inputType"
        class="signing-input"
        :placeholder="field.placeholder"
        :value="(field.value as string) ?? ''"
        @click.stop
        @focus="autoFill"
        @input="emit('update', ($event.target as HTMLInputElement).value)"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.signing-field {
  position: absolute;
  background: rgba(99, 102, 241, 0.08);
  border: 1.5px dashed rgba(99, 102, 241, 0.55);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  /* overflow visible so the required badge can extend above the field */
  overflow: visible;
  font-size: 12px;
  transition: all 0.15s var(--ws-easing);

  &:hover {
    background: rgba(99, 102, 241, 0.14);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.20);
  }
  &.is-active {
    border-style: solid;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.30);
  }
  &.is-filled {
    background: rgba(16, 185, 129, 0.08);
    border-color: rgb(var(--v-theme-success));
    border-style: solid;
  }
  &.is-image { background: rgba(99, 102, 241, 0.06); }

  /* Required + still empty: red glow + red left accent + pulsing border */
  &.is-needs-attention {
    background: rgba(239, 68, 68, 0.08);
    border-color: rgb(239, 68, 68);
    box-shadow:
      inset 4px 0 0 rgb(239, 68, 68),
      0 0 0 2px rgba(239, 68, 68, 0.20);
    animation: ws-required-pulse 2.4s ease-in-out infinite;
  }
  &.is-needs-attention.is-active {
    animation: none;
    box-shadow:
      inset 4px 0 0 rgb(239, 68, 68),
      0 0 0 3px rgba(239, 68, 68, 0.35);
  }
}

@keyframes ws-required-pulse {
  0%, 100% {
    box-shadow:
      inset 4px 0 0 rgb(239, 68, 68),
      0 0 0 2px rgba(239, 68, 68, 0.20);
  }
  50% {
    box-shadow:
      inset 4px 0 0 rgb(239, 68, 68),
      0 0 0 5px rgba(239, 68, 68, 0.08);
  }
}

/* Required pill — sits above the field, white text on red */
.required-badge {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px 2px 5px;
  background: rgb(239, 68, 68);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.35);
  pointer-events: none;
  z-index: 4;
  white-space: nowrap;
}

/* Filled state — green check at top-right */
.filled-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgb(16, 185, 129);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.35);
  pointer-events: none;
  z-index: 4;
}

.signing-field-prompt {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.is-needs-attention .signing-field-prompt {
  color: rgb(220, 38, 38);
}
.signing-field-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.signing-input {
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
  padding: 0 6px;
  font-family: inherit;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface));
  outline: none;
}
.signing-textarea { resize: none; padding: 4px 6px; }
.signing-checkbox {
  display: inline-flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  input { width: 70%; height: 70%; accent-color: rgb(var(--v-theme-primary)); cursor: pointer; }
}
</style>
