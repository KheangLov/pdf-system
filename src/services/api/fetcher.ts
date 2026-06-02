import type { ApiBinding } from '@/types'

interface CacheEntry {
  value: string
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()

function cacheKey(binding: ApiBinding): string {
  return `${binding.method ?? 'GET'}:${binding.url}:${binding.jsonPath ?? ''}`
}

/**
 * Extract a value from a JSON object by dot-notation path.
 *
 *   extractByPath({ user: { email: 'a@b.c' } }, 'user.email') → 'a@b.c'
 *   extractByPath({ items: [{ name: 'x' }] }, 'items[0].name') → 'x'
 *   extractByPath({ a: { b: null } }, 'a.b.c') → undefined
 */
export function extractByPath(obj: unknown, path: string): unknown {
  if (!path) return obj
  const parts = path.split('.')
  let cursor: unknown = obj
  for (const rawPart of parts) {
    if (cursor == null) return undefined
    /* Support `key[N]` array indexing repeated, e.g. matrix[0][1] */
    const m = rawPart.match(/^([^\[]+)((?:\[\d+\])*)$/)
    if (!m) return undefined
    const [, key, idxs] = m
    cursor = (cursor as Record<string, unknown>)[key]
    if (idxs) {
      for (const idxMatch of idxs.matchAll(/\[(\d+)\]/g)) {
        if (cursor == null) return undefined
        cursor = (cursor as unknown[])[Number(idxMatch[1])]
      }
    }
  }
  return cursor
}

export async function fetchApiValue(binding: ApiBinding): Promise<{
  value: string
  source: 'api' | 'cache' | 'default'
  error?: string
}> {
  if (!binding.url) return { value: binding.defaultValue ?? '', source: 'default' }

  const key = cacheKey(binding)
  const now = Date.now()
  const cached = cache.get(key)
  if (cached && cached.expiresAt > now) {
    return { value: cached.value, source: 'cache' }
  }

  try {
    const res = await fetch(binding.url, {
      method: binding.method ?? 'GET',
      headers: binding.headers
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)

    const contentType = res.headers.get('content-type') ?? ''
    let body: unknown
    if (contentType.includes('application/json')) {
      body = await res.json()
    } else {
      body = await res.text()
    }

    const extracted = extractByPath(body, binding.jsonPath ?? '')
    const value = extracted == null
      ? (binding.defaultValue ?? '')
      : typeof extracted === 'object'
        ? JSON.stringify(extracted)
        : String(extracted)

    cache.set(key, {
      value,
      expiresAt: now + Math.max(0, binding.cacheSeconds ?? 60) * 1000
    })
    return { value, source: 'api' }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      value: binding.defaultValue ?? '',
      source: 'default',
      error: message
    }
  }
}

export function clearApiCache() {
  cache.clear()
}
