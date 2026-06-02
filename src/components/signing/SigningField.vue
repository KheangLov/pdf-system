<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { SignField } from '@/types'
import { FIELD_CATALOG } from '@/constants/fields'
import { fetchApiValue } from '@/services/api/fetcher'
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

const needsAttention = computed(() => props.field.required && !isFilled.value)

const inputType = computed(() => {
  switch (props.field.type) {
    case 'email': return 'email'
    case 'phone': return 'tel'
    case 'date': return 'date'
    default: return 'text'
  }
})

/* ------------------------------------------------------------------ API field */
const apiState = ref<'idle' | 'loading' | 'success' | 'error' | 'default'>('idle')
const apiError = ref<string | null>(null)

async function refreshApiValue() {
  if (props.field.type !== 'api' || !props.field.apiBinding?.url) return
  apiState.value = 'loading'
  apiError.value = null
  const result = await fetchApiValue(props.field.apiBinding)
  /* Only overwrite an existing value if the signer hasn't edited it. */
  if (props.field.value == null || props.field.value === '' || props.field.value === props.field.apiBinding.defaultValue) {
    emit('update', result.value)
  }
  if (result.error) {
    apiState.value = 'error'
    apiError.value = result.error
  } else {
    apiState.value = result.source === 'default' ? 'default' : 'success'
  }
}

onMounted(() => {
  if (props.field.type === 'api') refreshApiValue()
})
watch(() => props.field.apiBinding?.url, () => {
  if (props.field.type === 'api') refreshApiValue()
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
      'is-image': field.type === 'signature',
      'is-api': field.type === 'api'
    }"
    :style="positionStyle"
    @click="emit('click')"
  >
    <span v-if="needsAttention" class="required-badge">
      <v-icon icon="mdi-asterisk" size="9" />
      Required
    </span>

    <span v-if="isFilled" class="filled-badge" aria-hidden="true">
      <v-icon icon="mdi-check" size="11" />
    </span>

    <template v-if="field.type === 'signature'">
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

    <template v-else-if="field.type === 'api'">
      <div v-if="apiState === 'loading'" class="api-loading">
        <v-icon icon="mdi-loading mdi-spin" size="14" />
        <span>Loading…</span>
      </div>
      <input
        v-else
        type="text"
        class="signing-input api-input"
        :placeholder="field.placeholder ?? 'Auto-filled from API'"
        :value="(field.value as string) ?? ''"
        @click.stop
        @input="emit('update', ($event.target as HTMLInputElement).value)"
      />
      <span
        v-if="apiState === 'success' || apiState === 'error' || apiState === 'default'"
        class="api-state-chip"
        :class="apiState"
        :title="apiError ?? ''"
      >
        <v-icon
          :icon="apiState === 'success' ? 'mdi-api' : apiState === 'default' ? 'mdi-cloud-off-outline' : 'mdi-alert-circle-outline'"
          size="10"
        />
        <span>{{ apiState === 'success' ? 'API' : apiState === 'default' ? 'Default' : 'Error' }}</span>
        <button v-if="!field.locked" class="api-refresh" title="Refresh" @click.stop="refreshApiValue">
          <v-icon icon="mdi-refresh" size="10" />
        </button>
      </span>
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
  &.is-api {
    background: rgba(20, 184, 166, 0.08);
    border-color: rgba(20, 184, 166, 0.55);
  }
  &.is-api.is-filled { background: rgba(20, 184, 166, 0.10); border-color: rgb(20, 184, 166); }

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
.is-needs-attention .signing-field-prompt { color: rgb(220, 38, 38); }
.signing-field-img { max-width: 100%; max-height: 100%; object-fit: contain; }

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

/* ------------------------------------------------------ API field bits */
.api-loading {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: rgb(20, 184, 166);
  font-weight: 500;
}
.api-input { font-weight: 500; }
.api-state-chip {
  position: absolute;
  top: -10px;
  right: 6px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 5px 1px 4px;
  border-radius: 999px;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: rgb(20, 184, 166);
  color: #fff;
  box-shadow: 0 1px 3px rgba(20, 184, 166, 0.4);
  z-index: 4;

  &.error { background: rgb(239, 68, 68); box-shadow: 0 1px 3px rgba(239, 68, 68, 0.4); }
  &.default { background: rgb(148, 163, 184); box-shadow: 0 1px 3px rgba(148, 163, 184, 0.4); }
}
.api-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.18);
  border: 0;
  border-radius: 999px;
  width: 14px;
  height: 14px;
  margin-left: 2px;
  padding: 0;
  color: inherit;
  cursor: pointer;
  &:hover { background: rgba(255,255,255,0.32); }
}
</style>
