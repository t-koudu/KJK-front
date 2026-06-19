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
    // recordsByDay: [{id, date, records: []}, ...]
    const [recordsByDay, setRecordsByDay] = useState([])
  const [session, setSession] = useState(null)
  const [page, setPage] = useState(pages.ATTENDANCE)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const auth = loadAuth()
    if (auth?.username) {
      setUsername(auth.username)
      const localRecords = loadRecords(auth.username)
      setRecordsByDay(localRecords)
      const localSession = loadSession(auth.username)
      setSession(localSession)

      // Attempt to load from Firestore (fallback if local is empty)
      if (localRecords.length === 0 || localSession === null) {
        loadRecordsFromFirestore(auth.username)
          .then((firestoreRecords) => {
            if (firestoreRecords && firestoreRecords.length > 0) {
              setRecordsByDay(firestoreRecords)
              saveRecords(auth.username, firestoreRecords)
            }
          })
          .catch((error) => console.log('Firestore load (non-critical):', error))

        loadSessionFromFirestore(auth.username)
          .then((firestoreSession) => {
            if (firestoreSession) {
              setSession(firestoreSession)
              saveSession(auth.username, firestoreSession)
            }
          })
          .catch((error) => console.log('Firestore session load (non-critical):', error))
      }
    }
  }, [])

  useEffect(() => {
    if (!username) {
        setRecordsByDay([])
      setSession(null)
      return
    }
      saveRecords(username, recordsByDay)
      saveRecordsToFirestore(username, recordsByDay)
        .catch((error) => console.log('Firestore save (non-critical):', error))
  }, [username, recordsByDay])

  useEffect(() => {
    if (!username) return
    if (session) {
      saveSession(username, session)
      saveSessionToFirestore(username, session)
        .catch((error) => console.log('Firestore session save (non-critical):', error))
    } else {
      clearSession(username)
      clearSessionFromFirestore(username)
        .catch((error) => console.log('Firestore session clear (non-critical):', error))
    }
  }, [username, session])

  const handleLogin = (user) => {
    setUsername(user)
      setRecordsByDay(loadRecords(user))
    setSession(loadSession(user))
    saveAuth(user)
    setMessage('')
  }

  const handleLogout = () => {
    if (username) {
      clearAuth()
      clearSession(username)
    }
    setUsername(null)
      setRecordsByDay([])
    setSession(null)
    setPage(pages.ATTENDANCE)
    setMessage('ログアウトしました。')
  }

  const handleStart = () => {
    if (!username) return
    const today = todayKey()
    setSession({ id: `${username}-${Date.now()}`, username, date: today, start: new Date().toISOString() })
    setMessage('勤務を開始しました。')
  }

  const handleEnd = () => {
    if (!session || session.username !== username) return
    const end = new Date().toISOString()
    const durationMs = new Date(end).getTime() - new Date(session.start).getTime()
    const newRecord = {
      id: `${username}-${session.start}-${end}`,
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
          copy.push({ id: `${username}-${session.date}`, date: session.date, records: [newRecord] })
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
