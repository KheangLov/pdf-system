import type { FieldDescriptor, FieldType } from '@/types'

export const FIELD_CATALOG: Record<FieldType, FieldDescriptor> = {
  signature: {
    type: 'signature',
    label: 'Signature',
    icon: 'mdi-draw-pen',
    description: 'Draw, type, or upload a signature',
    defaultWidth: 0.22,
    defaultHeight: 0.06,
    color: '#6366f1'
  },
  text: {
    type: 'text',
    label: 'Text',
    icon: 'mdi-format-text',
    description: 'Single-line text input',
    defaultWidth: 0.2,
    defaultHeight: 0.035,
    color: '#0ea5e9'
  },
  multiline: {
    type: 'multiline',
    label: 'Multiline Text',
    icon: 'mdi-text-long',
    description: 'Paragraph input',
    defaultWidth: 0.3,
    defaultHeight: 0.1,
    color: '#0ea5e9'
  },
  checkbox: {
    type: 'checkbox',
    label: 'Checkbox',
    icon: 'mdi-checkbox-outline',
    description: 'Toggleable checkbox',
    defaultWidth: 0.025,
    defaultHeight: 0.025,
    color: '#10b981'
  },
  selection: {
    type: 'selection',
    label: 'Selection',
    icon: 'mdi-form-dropdown',
    description: 'Dropdown of options',
    defaultWidth: 0.18,
    defaultHeight: 0.035,
    color: '#f59e0b'
  },
  date: {
    type: 'date',
    label: 'Date',
    icon: 'mdi-calendar',
    description: 'Auto-fills today',
    defaultWidth: 0.12,
    defaultHeight: 0.035,
    color: '#ef4444'
  },
  name: {
    type: 'name',
    label: 'Name',
    icon: 'mdi-account',
    description: 'Signer full name',
    defaultWidth: 0.2,
    defaultHeight: 0.035,
    color: '#6366f1'
  },
  email: {
    type: 'email',
    label: 'Email',
    icon: 'mdi-email-outline',
    description: 'Signer email',
    defaultWidth: 0.22,
    defaultHeight: 0.035,
    color: '#0ea5e9'
  },
  phone: {
    type: 'phone',
    label: 'Phone',
    icon: 'mdi-phone',
    description: 'Phone number',
    defaultWidth: 0.16,
    defaultHeight: 0.035,
    color: '#10b981'
  },
  company: {
    type: 'company',
    label: 'Company',
    icon: 'mdi-domain',
    description: 'Company name',
    defaultWidth: 0.22,
    defaultHeight: 0.035,
    color: '#8b5cf6'
  },
  title: {
    type: 'title',
    label: 'Title',
    icon: 'mdi-briefcase',
    description: 'Job title',
    defaultWidth: 0.18,
    defaultHeight: 0.035,
    color: '#f59e0b'
  },
  api: {
    type: 'api',
    label: 'API Field',
    icon: 'mdi-api',
    description: 'Auto-fill value from an API endpoint',
    defaultWidth: 0.24,
    defaultHeight: 0.04,
    color: '#14b8a6'
  }
}

export const FIELD_TYPES: FieldType[] = [
  'signature', 'text', 'multiline', 'checkbox',
  'selection', 'date', 'name', 'email', 'phone',
  'company', 'title', 'api'
]

export const SIGNATURE_FONTS = [
  { label: 'Caveat', value: 'Caveat, cursive' },
  { label: 'Dancing Script', value: 'Dancing Script, cursive' },
  { label: 'Great Vibes', value: 'Great Vibes, cursive' },
  { label: 'Allura', value: 'Allura, cursive' }
]
