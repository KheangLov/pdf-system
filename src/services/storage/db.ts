import { openDB, type IDBPDatabase } from 'idb'
import type { SignDocument, SignTemplate, SavedSignature, UIPreferences } from '@/types'

const DB_NAME = 'wing-sign'
const DB_VERSION = 1

interface WingSignSchema {
  documents: SignDocument
  templates: SignTemplate
  signatures: SavedSignature
  preferences: UIPreferences & { id: string }
}

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents')) {
          const store = db.createObjectStore('documents', { keyPath: 'id' })
          store.createIndex('updatedAt', 'updatedAt')
          store.createIndex('status', 'status')
        }
        if (!db.objectStoreNames.contains('templates')) {
          const store = db.createObjectStore('templates', { keyPath: 'id' })
          store.createIndex('updatedAt', 'updatedAt')
          store.createIndex('category', 'category')
        }
        if (!db.objectStoreNames.contains('signatures')) {
          db.createObjectStore('signatures', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'id' })
        }
      }
    })
  }
  return dbPromise
}

export const documentsRepo = {
  async list(): Promise<SignDocument[]> {
    const db = await getDb()
    const all = await db.getAll('documents')
    return all.sort((a, b) => b.updatedAt - a.updatedAt)
  },
  async get(id: string): Promise<SignDocument | undefined> {
    const db = await getDb()
    return db.get('documents', id)
  },
  async put(doc: SignDocument): Promise<void> {
    const db = await getDb()
    await db.put('documents', { ...doc, updatedAt: Date.now() })
  },
  async remove(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('documents', id)
  }
}

export const templatesRepo = {
  async list(): Promise<SignTemplate[]> {
    const db = await getDb()
    const all = await db.getAll('templates')
    return all.sort((a, b) => b.updatedAt - a.updatedAt)
  },
  async get(id: string): Promise<SignTemplate | undefined> {
    const db = await getDb()
    return db.get('templates', id)
  },
  async put(tpl: SignTemplate): Promise<void> {
    const db = await getDb()
    await db.put('templates', { ...tpl, updatedAt: Date.now() })
  },
  async remove(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('templates', id)
  }
}

export const signaturesRepo = {
  async list(): Promise<SavedSignature[]> {
    const db = await getDb()
    const all = await db.getAll('signatures')
    return all.sort((a, b) => b.createdAt - a.createdAt)
  },
  async put(sig: SavedSignature): Promise<void> {
    const db = await getDb()
    await db.put('signatures', sig)
  },
  async remove(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('signatures', id)
  }
}

const PREFS_KEY = 'default'

export const preferencesRepo = {
  async get(): Promise<UIPreferences | null> {
    const db = await getDb()
    const result = await db.get('preferences', PREFS_KEY)
    if (!result) return null
    const { id: _id, ...prefs } = result
    return prefs as UIPreferences
  },
  async put(prefs: UIPreferences): Promise<void> {
    const db = await getDb()
    await db.put('preferences', { ...prefs, id: PREFS_KEY })
  }
}
