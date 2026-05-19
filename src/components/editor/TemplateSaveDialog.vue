<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEditorStore, useTemplateStore, useUIStore } from '@/stores'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const editor = useEditorStore()
const templates = useTemplateStore()
const ui = useUIStore()

const name = ref('')
const description = ref('')
const category = ref('')
const busy = ref(false)

watch(() => props.modelValue, (open) => {
  if (open) {
    name.value = editor.document?.name?.replace(/\.pdf$/i, '') ?? 'Template'
    description.value = ''
    category.value = ''
  }
})

async function save() {
  if (!editor.document) return
  busy.value = true
  try {
    await templates.createFromDocument(editor.document, {
      name: name.value.trim(),
      description: description.value || undefined,
      category: category.value || undefined
    })
    ui.pushToast('Template saved', 'success')
    emit('update:modelValue', false)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="480">
    <v-card>
      <v-card-title class="d-flex align-center pa-5">
        <v-icon icon="mdi-bookmark-plus-outline" class="me-2" />
        Save as template
      </v-card-title>
      <v-card-text class="pa-5 pt-0">
        <v-text-field v-model="name" label="Template name" autofocus />
        <v-text-field v-model="category" label="Category" class="mt-2" placeholder="e.g. HR, Sales" />
        <v-textarea v-model="description" label="Description" rows="3" class="mt-2" />
      </v-card-text>
      <v-card-actions class="px-5 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :loading="busy" @click="save">Save template</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
