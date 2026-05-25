function safeEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function safeDecode(s: string): string {
  let b = s.replace(/-/g, '+').replace(/_/g, '/')
  while (b.length % 4) b += '='
  return decodeURIComponent(escape(atob(b)))
}

export function encodeState<T>(state: T): string {
  return safeEncode(JSON.stringify(state))
}

export function decodeState<T>(encoded: string | null): T | null {
  if (!encoded) return null
  try {
    return JSON.parse(safeDecode(encoded)) as T
  } catch {
    return null
  }
}

export function readHashParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams()
  const hash = window.location.hash.replace(/^#/, '')
  return new URLSearchParams(hash)
}

export function writeHashParams(updater: (params: URLSearchParams) => void): void {
  if (typeof window === 'undefined') return
  const params = readHashParams()
  updater(params)
  const next = params.toString()
  const newHash = next ? `#${next}` : ''
  const url = `${window.location.pathname}${window.location.search}${newHash}`
  window.history.replaceState(null, '', url)
}
