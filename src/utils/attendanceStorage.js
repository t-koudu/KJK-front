const STORAGE_PREFIX = 'kjk-attendance'
const authKey = `${STORAGE_PREFIX}:auth`
const recordsKey = (username) => `${STORAGE_PREFIX}:records:${username}`
const sessionKey = (username) => `${STORAGE_PREFIX}:session:${username}`

export function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(authKey))
  } catch {
    return null
  }
}

export function saveAuth(auth) {
  // auth: { username, userKey }
  localStorage.setItem(authKey, JSON.stringify(auth))
  return auth
}

export function clearAuth() {
  localStorage.removeItem(authKey)
}

// Records are stored as an array of day groups:
// [{ id, date, records: [{id,start,end,durationMs,...}, ...] }, ...]
export function loadRecords(userKey) {
  try {
    return JSON.parse(localStorage.getItem(recordsKey(userKey)) || '[]')
  } catch {
    return []
  }
}

export function saveRecords(userKey, groups) {
  localStorage.setItem(recordsKey(userKey), JSON.stringify(groups))
}

export function loadSession(userKey) {
  try {
    return JSON.parse(localStorage.getItem(sessionKey(userKey)))
  } catch {
    return null
  }
}

export function saveSession(userKey, session) {
  localStorage.setItem(sessionKey(userKey), JSON.stringify(session))
}

export function clearSession(userKey) {
  localStorage.removeItem(sessionKey(userKey))
}

export async function deriveUserKey(username, password) {
  // Produce a SHA-256 hex digest of `${username}:${password}` as deterministic key
  try {
    const input = `${username}:${password}`
    const enc = new TextEncoder()
    const data = enc.encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  } catch (e) {
    console.error('deriveUserKey error', e)
    // Fallback to plain username if crypto not available
    return `${username}`
  }
}

export function formatTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatDuration(durationMs) {
  const totalMinutes = Math.max(0, Math.round(durationMs / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

// Helper: flatten groups into list of records with date included
export function flattenGroups(groups) {
  return groups.flatMap((g) => (g.records || []).map((r) => ({ ...r, date: g.date })))
}
