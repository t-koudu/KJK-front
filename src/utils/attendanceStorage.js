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

export function saveAuth(username) {
  const auth = { username }
  localStorage.setItem(authKey, JSON.stringify(auth))
  return auth
}

export function clearAuth() {
  localStorage.removeItem(authKey)
}

// Records are stored as an array of day groups:
// [{ id, date, records: [{id,start,end,durationMs,...}, ...] }, ...]
export function loadRecords(username) {
  try {
    return JSON.parse(localStorage.getItem(recordsKey(username)) || '[]')
  } catch {
    return []
  }
}

export function saveRecords(username, groups) {
  localStorage.setItem(recordsKey(username), JSON.stringify(groups))
}

export function loadSession(username) {
  try {
    return JSON.parse(localStorage.getItem(sessionKey(username)))
  } catch {
    return null
  }
}

export function saveSession(username, session) {
  localStorage.setItem(sessionKey(username), JSON.stringify(session))
}

export function clearSession(username) {
  localStorage.removeItem(sessionKey(username))
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
