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
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const initializeFromStorage = async () => {
      const auth = loadAuth()
      if (!auth?.username || !auth?.userKey) {
        setIsInitializing(false)
        return
      }

      setUsername(auth.username)
      setUserKey(auth.userKey)

      const localRecords = loadRecords(auth.userKey)
      const localSession = loadSession(auth.userKey)

      if (localRecords.length > 0) {
        setRecordsByDay(localRecords)
      }
      if (localSession) {
        setSession(localSession)
      }

      if (localRecords.length === 0) {
        try {
          const firestoreRecords = await loadRecordsFromFirestore(auth.userKey)
          if (firestoreRecords && firestoreRecords.length > 0) {
            setRecordsByDay(firestoreRecords)
            saveRecords(auth.userKey, firestoreRecords)
          }
        } catch (error) {
          console.log('Firestore load (non-critical):', error)
        }
      }

      if (localSession === null) {
        try {
          const firestoreSession = await loadSessionFromFirestore(auth.userKey)
          if (firestoreSession) {
            setSession(firestoreSession)
            saveSession(auth.userKey, firestoreSession)
          }
        } catch (error) {
          console.log('Firestore session load (non-critical):', error)
        }
      }

      setIsInitializing(false)
    }

    initializeFromStorage()
  }, [])

  useEffect(() => {
    if (!username || !userKey || isInitializing) return
    saveRecords(userKey, recordsByDay)
    saveRecordsToFirestore(userKey, recordsByDay)
      .catch((error) => console.log('Firestore save (non-critical):', error))
  }, [username, userKey, recordsByDay, isInitializing])

  useEffect(() => {
    if (!username || !userKey || isInitializing) return
    if (session) {
      saveSession(userKey, session)
      saveSessionToFirestore(userKey, session)
        .catch((error) => console.log('Firestore session save (non-critical):', error))
    } else {
      clearSession(userKey)
      clearSessionFromFirestore(userKey)
        .catch((error) => console.log('Firestore session clear (non-critical):', error))
    }
  }, [username, userKey, session, isInitializing])

  const handleLogin = async (user, password) => {
    const key = await deriveUserKey(user, password)
    setUsername(user)
    setUserKey(key)
    saveAuth({ username: user, userKey: key })
    setMessage('')

    // Try to load local records first
    const localRecords = loadRecords(key)
    let recordsToLoad = localRecords

    // If local is empty, fetch from Firestore
    if (localRecords.length === 0) {
      try {
        const firestoreRecords = await loadRecordsFromFirestore(key)
        if (firestoreRecords && firestoreRecords.length > 0) {
          recordsToLoad = firestoreRecords
          // Persist to local storage
          saveRecords(key, firestoreRecords)
        }
      } catch (error) {
        console.error('Failed to load records from Firestore:', error)
      }
    }
    setRecordsByDay(recordsToLoad)

    // Try to load local session first
    const localSession = loadSession(key)
    let sessionToLoad = localSession

    // If local is empty, fetch from Firestore
    if (!localSession) {
      try {
        const firestoreSession = await loadSessionFromFirestore(key)
        if (firestoreSession) {
          sessionToLoad = firestoreSession
          // Persist to local storage
          saveSession(key, firestoreSession)
        }
      } catch (error) {
        console.error('Failed to load session from Firestore:', error)
      }
    }
    setSession(sessionToLoad)

    setIsInitializing(false)
  }

  const handleLogout = () => {
    // Clear auth but preserve session so work can resume after re-login
    if (username) {
      clearAuth()
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
