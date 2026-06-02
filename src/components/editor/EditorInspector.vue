<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores'
import { FIELD_CATALOG } from '@/constants/fields'

const editor = useEditorStore()
const field = computed(() => editor.primarySelection)
const selectedCount = computed(() => editor.selectedFields.length)

function patch<K extends keyof NonNullable<typeof field.value>>(key: K, value: any) {
  if (!field.value) return
  editor.updateField(field.value.id, { [key]: value } as any)
}
function patchStyle(key: string, value: any) {
  if (!field.value) return
  editor.updateField(field.value.id, {
    style: { ...(field.value.style ?? {}), [key]: value }
  } as any)
}
function patchValidation(key: string, value: any) {
  if (!field.value) return
  editor.updateField(field.value.id, {
    validation: { ...(field.value.validation ?? {}), [key]: value }
  } as any)
}
function patchApi(key: string, value: any) {
  if (!field.value) return
  editor.updateField(field.value.id, {
    apiBinding: { url: '', ...(field.value.apiBinding ?? {}), [key]: value }
  } as any)
}

const meta = computed(() => field.value ? FIELD_CATALOG[field.value.type] : null)
const isSelectionType = computed(() => field.value?.type === 'selection')
const isApiType = computed(() => field.value?.type === 'api')

const API_PRESETS = [
  { label: 'User profile (mock)', url: 'https://jsonplaceholder.typicode.com/users/1', jsonPath: 'name' },
  { label: 'User email (mock)', url: 'https://jsonplaceholder.typicode.com/users/1', jsonPath: 'email' },
  { label: 'Company name (mock)', url: 'https://jsonplaceholder.typicode.com/users/1', jsonPath: 'company.name' },
  { label: 'Random fact (cat)', url: 'https://catfact.ninja/fact', jsonPath: 'fact' }
] as const

function applyPreset(preset: typeof API_PRESETS[number]) {
  if (!field.value) return
  editor.updateField(field.value.id, {
    apiBinding: {
      ...(field.value.apiBinding ?? {}),
      url: preset.url,
      jsonPath: preset.jsonPath,
      method: 'GET'
    }
  } as any)
  editor.commitUpdate('Applied API preset')
}
</script>

<template>
  <aside class="editor-inspector">
    <div v-if="!field" class="empty-inspector">
      <v-icon icon="mdi-cursor-default-outline" size="40" />
      <h3>No field selected</h3>
      <p>Drag a field from the left panel onto the document, then select it to edit its properties.</p>
    </div>

    <div v-else-if="selectedCount > 1" class="bulk-inspector">
      <h3>{{ selectedCount }} fields selected</h3>
      <div class="bulk-actions">
        <v-btn block prepend-icon="mdi-content-copy" variant="tonal" @click="editor.duplicateSelection()">
          Duplicate
        </v-btn>
        <v-btn block prepend-icon="mdi-asterisk" variant="tonal" @click="editor.toggleRequiredSelection()">
          Toggle required
        </v-btn>
        <v-btn block prepend-icon="mdi-lock-outline" variant="tonal" @click="editor.toggleLockSelection()">
          Toggle lock
        </v-btn>
        <v-btn block prepend-icon="mdi-trash-can-outline" color="error" variant="tonal" @click="editor.deleteSelection()">
          Delete
        </v-btn>
      </div>
    </div>

    <div v-else class="inspector-body">
      <div class="inspector-head">
        <div class="head-icon" :style="{ background: meta!.color + '18', color: meta!.color }">
          <v-icon :icon="meta!.icon" />
        </div>
        <div>
          <div class="head-title">{{ meta!.label }} field</div>
          <div class="head-sub">{{ meta!.description }}</div>
        </div>
      </div>

      <v-expansion-panels variant="accordion" multiple :model-value="['general', 'api', 'appearance']" class="inspector-panels">
        <v-expansion-panel v-if="isApiType" value="api" title="API Mapping">
          <template #text>
            <p class="api-help">
              Fetch a value from any HTTP endpoint when the signer opens the document.
              Extract a single field using dot-notation (e.g. <code>user.email</code> or <code>items[0].name</code>).
            </p>

            <v-text-field
              :model-value="field.apiBinding?.url"
              label="Endpoint URL"
              placeholder="https://api.example.com/users/1"
              density="compact"
              @update:model-value="patchApi('url', $event)"
              @blur="editor.commitUpdate('Updated API URL')"
            />
            <div class="row-grid mt-2">
              <v-select
                :model-value="field.apiBinding?.method ?? 'GET'"
                :items="['GET', 'POST']"
                label="Method"
                density="compact"
                @update:model-value="patchApi('method', $event); editor.commitUpdate('Updated API method')"
              />
              <v-text-field
                :model-value="field.apiBinding?.cacheSeconds ?? 60"
                type="number"
                label="Cache (s)"
                density="compact"
                @update:model-value="patchApi('cacheSeconds', Number($event) || 0)"
              />
            </div>
            <v-text-field
              class="mt-2"
              :model-value="field.apiBinding?.jsonPath"
              label="JSON path"
              placeholder="data.user.email"
              density="compact"
              @update:model-value="patchApi('jsonPath', $event)"
              @blur="editor.commitUpdate('Updated JSON path')"
            />
            <v-text-field
              class="mt-2"
              :model-value="field.apiBinding?.defaultValue"
              label="Fallback value"
              placeholder="Shown if the API fails"
              density="compact"
              @update:model-value="patchApi('defaultValue', $event)"
              @blur="editor.commitUpdate('Updated fallback')"
            />

            <div class="api-presets">
              <span class="api-presets-label">Quick presets</span>
              <button
                v-for="p in API_PRESETS"
                :key="p.label"
                class="api-preset"
                @click="applyPreset(p)"
              >{{ p.label }}</button>
            </div>
          </template>
        </v-expansion-panel>

        <v-expansion-panel value="general" title="General">
          <template #text>
            <v-text-field
              :model-value="field.label"
              label="Label"
              @update:model-value="patch('label', $event)"
              @blur="editor.commitUpdate('Updated label')"
            />
            <v-text-field
              class="mt-2"
              :model-value="field.placeholder"
              label="Placeholder"
              @update:model-value="patch('placeholder', $event)"
              @blur="editor.commitUpdate('Updated placeholder')"
            />
            <v-text-field
              class="mt-2"
              :model-value="field.defaultValue"
              label="Default value"
              @update:model-value="patch('defaultValue', $event)"
              @blur="editor.commitUpdate('Updated default')"
            />
            <v-switch
              class="mt-2"
              :model-value="field.required"
              label="Required"
              color="primary"
              hide-details
              density="compact"
              inset
              @update:model-value="patch('required', $event); editor.commitUpdate('Required toggled')"
            />
            <v-switch
              :model-value="field.locked"
              label="Locked"
              color="primary"
              hide-details
              density="compact"
              inset
              @update:model-value="patch('locked', $event); editor.commitUpdate('Lock toggled')"
            />

            <v-textarea
              v-if="isSelectionType"
              class="mt-2"
              :model-value="(field.options ?? []).join('\n')"
              label="Options (one per line)"
              rows="4"
              @update:model-value="patch('options', ($event ?? '').split('\n').filter(Boolean))"
              @blur="editor.commitUpdate('Updated options')"
            />
          </template>
        </v-expansion-panel>

        <v-expansion-panel value="appearance" title="Appearance">
          <template #text>
            <div class="row-grid">
              <v-text-field
                :model-value="field.style?.fontSize ?? 12"
                type="number"
                label="Font size"
                density="compact"
                @update:model-value="patchStyle('fontSize', Number($event))"
              />
              <v-select
                :model-value="field.style?.fontWeight ?? 'normal'"
                :items="['normal', 'bold']"
                label="Weight"
                density="compact"
                @update:model-value="patchStyle('fontWeight', $event)"
              />
            </div>
            <div class="row-grid mt-2">
              <v-text-field
                :model-value="field.style?.color ?? '#0f172a'"
                label="Text color"
                density="compact"
                @update:model-value="patchStyle('color', $event)"
              >
                <template #prepend-inner>
                  <span class="swatch" :style="{ background: field.style?.color ?? '#0f172a' }" />
                </template>
              </v-text-field>
              <v-text-field
                :model-value="field.style?.borderColor ?? '#6366f1'"
                label="Border"
                density="compact"
                @update:model-value="patchStyle('borderColor', $event)"
              >
                <template #prepend-inner>
                  <span class="swatch" :style="{ background: field.style?.borderColor ?? '#6366f1' }" />
                </template>
              </v-text-field>
            </div>
            <v-select
              class="mt-2"
              :model-value="field.style?.align ?? 'left'"
              :items="[
                { title: 'Left', value: 'left' },
                { title: 'Center', value: 'center' },
                { title: 'Right', value: 'right' }
              ]"
              label="Alignment"
              density="compact"
              @update:model-value="patchStyle('align', $event)"
            />
          </template>
        </v-expansion-panel>

        <v-expansion-panel value="validation" title="Validation">
          <template #text>
            <v-text-field
              :model-value="field.validation?.pattern"
              label="Regex pattern"
              placeholder="^[A-Z].*"
              density="compact"
              @update:model-value="patchValidation('pattern', $event)"
            />
            <div class="row-grid mt-2">
              <v-text-field
                :model-value="field.validation?.minLength"
                type="number"
                label="Min length"
                density="compact"
                @update:model-value="patchValidation('minLength', Number($event) || undefined)"
              />
              <v-text-field
                :model-value="field.validation?.maxLength"
                type="number"
                label="Max length"
                density="compact"
                @update:model-value="patchValidation('maxLength', Number($event) || undefined)"
              />
            </div>
            <v-text-field
              class="mt-2"
              :model-value="field.validation?.message"
              label="Error message"
              density="compact"
              @update:model-value="patchValidation('message', $event)"
            />
          </template>
        </v-expansion-panel>

        <v-expansion-panel value="position" title="Position & size">
          <template #text>
            <div class="row-grid">
              <v-text-field :model-value="(field.position.x * 100).toFixed(1)" suffix="%" label="X" density="compact" readonly />
              <v-text-field :model-value="(field.position.y * 100).toFixed(1)" suffix="%" label="Y" density="compact" readonly />
            </div>
            <div class="row-grid mt-2">
              <v-text-field :model-value="(field.position.width * 100).toFixed(1)" suffix="%" label="Width" density="compact" readonly />
              <v-text-field :model-value="(field.position.height * 100).toFixed(1)" suffix="%" label="Height" density="compact" readonly />
            </div>
            <div class="mt-2 text-caption text-medium-emphasis">Page {{ field.position.page }}</div>
          </template>
        </v-expansion-panel>
      </v-expansion-panels>

      <div class="inspector-actions">
        <v-btn block prepend-icon="mdi-content-copy" variant="tonal" @click="editor.duplicateSelection()">Duplicate</v-btn>
        <v-btn block prepend-icon="mdi-trash-can-outline" color="error" variant="tonal" @click="editor.deleteSelection()">Delete</v-btn>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.editor-inspector {
  width: 320px;
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
  border-left: 1px solid rgb(var(--v-theme-border));
  overflow-y: auto;
  height: 100%;
}
.empty-inspector, .bulk-inspector {
  padding: 32px 20px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
  h3 { margin: 12px 0 4px; font-size: 14px; font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
  p { font-size: 12.5px; margin: 0; }
}
.bulk-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }

.inspector-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.inspector-head {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 10px;
}
.head-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.head-title { font-weight: 600; font-size: 13.5px; }
.head-sub { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); }

.inspector-panels { box-shadow: none; }
:deep(.v-expansion-panel-title) { font-size: 13px; font-weight: 600; min-height: 44px; }
:deep(.v-expansion-panel) { background: transparent !important; border: 1px solid rgb(var(--v-theme-border)); border-radius: 10px !important; margin-bottom: 6px; }
:deep(.v-expansion-panel--active + .v-expansion-panel) { margin-top: 6px; }

.row-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.swatch { width: 14px; height: 14px; border-radius: 3px; border: 1px solid rgb(var(--v-theme-border)); margin-right: 4px; }

.inspector-actions { display: flex; flex-direction: column; gap: 8px; }

/* API mapping panel */
.api-help {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0 0 10px;
  line-height: 1.45;
  code {
    background: rgb(var(--v-theme-surface-variant));
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 11px;
    font-family: var(--ws-font-mono);
  }
}
.api-presets {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.api-presets-label {
  width: 100%;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 2px;
}
.api-preset {
  font-size: 11.5px;
  padding: 4px 8px;
  background: rgba(20, 184, 166, 0.10);
  color: rgb(13, 148, 136);
  border: 1px solid rgba(20, 184, 166, 0.30);
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.12s var(--ws-easing);
  &:hover {
    background: rgba(20, 184, 166, 0.18);
    border-color: rgba(20, 184, 166, 0.50);
  }
}

@media (max-width: 1100px) {
  .editor-inspector { width: 280px; }
}
</style>
