export type UUID = string

export type FieldType =
  | 'signature'
  | 'text'
  | 'multiline'
  | 'checkbox'
  | 'selection'
  | 'date'
  | 'name'
  | 'email'
  | 'phone'
  | 'company'
  | 'title'
  | 'api'

export interface FieldStyle {
  fontFamily?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  italic?: boolean
  color?: string
  background?: string
  borderColor?: string
  borderWidth?: number
  align?: 'left' | 'center' | 'right'
  radius?: number
}

export interface FieldValidation {
  pattern?: string
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  message?: string
}

export interface ApiBinding {
  url: string
  method?: 'GET' | 'POST'
  /** Dot-notation path into the JSON response, e.g. "data.user.email" or "items[0].name". Empty = use raw response. */
  jsonPath?: string
  /** Headers serialised as key/value pairs. */
  headers?: Record<string, string>
  /** Used if the request fails or returns null. */
  defaultValue?: string
  /** Cache TTL in seconds. Same URL+path within the window reuses the result. */
  cacheSeconds?: number
}

/** Normalised position — page-relative (0..1) so it stays consistent across zoom levels. */
export interface FieldPosition {
  page: number
  x: number
  y: number
  width: number
  height: number
}

export interface SignField {
  id: UUID
  type: FieldType
  position: FieldPosition
  label?: string
  placeholder?: string
  required: boolean
  locked: boolean
  options?: string[]
  defaultValue?: string
  value?: string | boolean | null
  style?: FieldStyle
  validation?: FieldValidation
  apiBinding?: ApiBinding
  createdAt: number
  updatedAt: number
}

export interface DocumentPageMeta {
  index: number
  width: number
  height: number
  rotation: number
}

export interface SignDocument {
  id: UUID
  name: string
  size: number
  pageCount: number
  pages: DocumentPageMeta[]
  pdfData: ArrayBuffer
  thumbnail?: string
  fields: SignField[]
  status: 'draft' | 'ready' | 'signed' | 'archived'
  createdAt: number
  updatedAt: number
  signedAt?: number
}

export interface SignTemplate {
  id: UUID
  name: string
  description?: string
  category?: string
  baseDocumentName: string
  pdfData: ArrayBuffer
  pageCount: number
  pages: DocumentPageMeta[]
  fields: SignField[]
  thumbnail?: string
  createdAt: number
  updatedAt: number
  useCount: number
}

export interface SavedSignature {
  id: UUID
  name: string
  type: 'draw' | 'type' | 'upload'
  dataUrl: string
  width: number
  height: number
  createdAt: number
  isDefault?: boolean
}

export interface HistoryEntry {
  id: UUID
  label: string
  timestamp: number
  snapshot: SignField[]
}

export interface UIPreferences {
  theme: 'light' | 'dark'
  primaryColor: string
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  autoSave: boolean
  showRulers: boolean
  density: 'compact' | 'comfortable'
}

export interface Toast {
  id: UUID
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

export interface FieldDescriptor {
  type: FieldType
  label: string
  icon: string
  description: string
  defaultWidth: number
  defaultHeight: number
  color: string
}
