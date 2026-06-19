import { useEffect, useState } from 'react'
import LoginPage from './components/LoginPage'
import AttendancePage from './components/AttendancePage'
import HistoryPage from './components/HistoryPage'
import {
  clearAuth,
  clearSession,
  formatDuration,
  loadAuth,
  loadRecords,
  loadSession,
  saveAuth,
  saveRecords,
  saveSession,
  deriveUserKey,
  todayKey
} from './utils/attendanceStorage'
import {
  saveRecordsToFirestore,
  loadRecordsFromFirestore,
  saveSessionToFirestore,
  loadSessionFromFirestore,
  clearSessionFromFirestore
} from './utils/firebase'

const pages = {
  ATTENDANCE: 'attendance',
  HISTORY: 'history'
}

function App() {
  const [username, setUsername] = useState(null)
  const [userKey, setUserKey] = useState(null)
    // recordsByDay: [{id, date, records: []}, ...]
    const [recordsByDay, setRecordsByDay] = useState([])
  const [session, setSession] = useState(null)
  const [page, setPage] = useState(pages.ATTENDANCE)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const auth = loadAuth()
    if (auth?.username && auth?.userKey) {
      setUsername(auth.username)
      setUserKey(auth.userKey)
      const localRecords = loadRecords(auth.userKey)
      setRecordsByDay(localRecords)
      const localSession = loadSession(auth.userKey)
      setSession(localSession)

      // Attempt to load from Firestore (fallback if local is empty)
      if (localRecords.length === 0 || localSession === null) {
        loadRecordsFromFirestore(auth.userKey)
          .then((firestoreRecords) => {
            if (firestoreRecords && firestoreRecords.length > 0) {
              setRecordsByDay(firestoreRecords)
              saveRecords(auth.userKey, firestoreRecords)
            }
          })
          .catch((error) => console.log('Firestore load (non-critical):', error))

        loadSessionFromFirestore(auth.userKey)
          .then((firestoreSession) => {
            if (firestoreSession) {
              setSession(firestoreSession)
              saveSession(auth.userKey, firestoreSession)
            }
          })
          .catch((error) => console.log('Firestore session load (non-critical):', error))
      }
    }
  }, [])

  useEffect(() => {
    if (!username || !userKey) return
    saveRecords(userKey, recordsByDay)
    saveRecordsToFirestore(userKey, recordsByDay)
      .catch((error) => console.log('Firestore save (non-critical):', error))
  }, [username, userKey, recordsByDay])

  useEffect(() => {
    if (!username || !userKey) return
    if (session) {
      saveSession(userKey, session)
      saveSessionToFirestore(userKey, session)
        .catch((error) => console.log('Firestore session save (non-critical):', error))
    } else {
      clearSession(userKey)
      clearSessionFromFirestore(userKey)
        .catch((error) => console.log('Firestore session clear (non-critical):', error))
    }
  }, [username, userKey, session])

  const handleLogin = async (user, password) => {
    // Derive deterministic key from username+password
    const key = await deriveUserKey(user, password)
    setUsername(user)
    setUserKey(key)
    setRecordsByDay(loadRecords(key))
    setSession(loadSession(key))
    saveAuth({ username: user, userKey: key })
    setMessage('')
  }

  const handleLogout = () => {
    if (username) {
      clearAuth()
      if (userKey) clearSession(userKey)
    }
    setUsername(null)
      setUserKey(null)
      setRecordsByDay([])
    setSession(null)
    setPage(pages.ATTENDANCE)
    setMessage('ログアウトしました。')
  }

  const handleStart = () => {
    if (!username || !userKey) return
    const today = todayKey()
    const s = { id: `${userKey}-${Date.now()}`, username, date: today, start: new Date().toISOString() }
    setSession(s)
    setMessage('勤務を開始しました。')
  }

  const handleEnd = () => {
    if (!session || session.username !== username) return
    const end = new Date().toISOString()
    const durationMs = new Date(end).getTime() - new Date(session.start).getTime()
    const newRecord = {
      id: `${userKey}-${session.start}-${end}`,
      username,
      date: session.date,
      start: session.start,
      end,
      durationMs
    }
      setRecordsByDay((prev) => {
        const copy = JSON.parse(JSON.stringify(prev || []))
        const idx = copy.findIndex((g) => g.date === session.date)
        if (idx >= 0) {
          copy[idx].records = copy[idx].records || []
          copy[idx].records.push(newRecord)
        } else {
          copy.push({ id: `${userKey}-${session.date}`, date: session.date, records: [newRecord] })
        }
        return copy
      })
    setSession(null)
    setMessage(`勤務を終了しました。勤務時間: ${formatDuration(durationMs)}`)
  }

  const navigateToHistory = () => {
    setPage(page === pages.HISTORY ? pages.ATTENDANCE : pages.HISTORY)
    setMessage('')
  }

  if (!username) {
    return (
      <div className="container py-5">
        {message && <div className="alert alert-success">{message}</div>}
        <LoginPage onLogin={handleLogin} />
      </div>
    )
  }

  return (
    <div className="container py-4">
      {message && <div className="alert alert-success">{message}</div>}
      {page === pages.ATTENDANCE ? (
        <AttendancePage
          username={username}
            records={recordsByDay}
          session={session}
          onStart={handleStart}
          onEnd={handleEnd}
          onNavigate={navigateToHistory}
          onLogout={handleLogout}
        />
      ) : (
          <HistoryPage records={recordsByDay} session={session} onNavigate={navigateToHistory} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App
