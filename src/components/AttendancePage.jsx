import { formatDuration, formatTime, formatDate, todayKey } from '../utils/attendanceStorage'

function AttendancePage({ username, records, session, onStart, onEnd, onNavigate, onLogout }) {
  const today = todayKey()
   // `records` is groups: [{id,date,records:[]}, ...]
   const todayGroup = (records || []).find((g) => g.date === today) || { records: [] }
   const todayRecords = todayGroup.records || []

  const isActiveToday = session && session.date === today
  const activeDuration = isActiveToday ? Date.now() - new Date(session.start).getTime() : 0
  const activeTime = isActiveToday ? formatDuration(activeDuration) : null

  // Compute total as (lastEnd - firstStart) using today's records.
  const startTimes = todayRecords.map((r) => new Date(r.start).getTime())
  if (isActiveToday) startTimes.push(new Date(session.start).getTime())
  const endTimes = todayRecords.map((r) => r.end ? new Date(r.end).getTime() : null).filter(Boolean)
  const firstStartMs = startTimes.length > 0 ? Math.min(...startTimes) : null
  const lastEndMs = isActiveToday ? Date.now() : endTimes.length > 0 ? Math.max(...endTimes) : null
  const totalPeriodMs = firstStartMs && lastEndMs ? Math.max(0, lastEndMs - firstStartMs) : 0

  const allStarts = todayRecords.map((record) => record.start)
  const allEnds = todayRecords.map((record) => record.end)
  if (session) {
    allStarts.push(session.start)
  }

  const firstStart = allStarts.length > 0 ? new Date(Math.min(...allStarts.map((value) => new Date(value).getTime()))) : null
  const lastEnd = allEnds.length > 0 ? new Date(Math.max(...allEnds.map((value) => new Date(value).getTime()))) : null

  return (
    <div className="app">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">勤怠入力</h1>
          <p className="text-muted mb-0">ようこそ、{username} さん。</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-primary" onClick={onNavigate}>
            勤務時間を確認する
          </button>
          <button className="btn btn-outline-secondary" onClick={onLogout}>
            ログアウト
          </button>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5 card-title">
            本日の勤務 <small className="text-muted ms-2">{formatDate(today)}</small>
          </h2>
          <p className="card-text mb-2">
            今日の合計勤務時間: <strong>{formatDuration(totalPeriodMs)}</strong>
          </p>
          {firstStart ? (
            <p className="text-muted mb-2">
              期間: {formatTime(firstStart.toISOString())} 〜 {session ? '現在' : lastEnd ? formatTime(lastEnd.toISOString()) : 'ー'}
            </p>
          ) : (
            <p className="text-muted mb-2">まだ勤務が開始されていません。</p>
          )}
          {isActiveToday ? (
            <p className="text-muted mb-0">勤務中: {formatTime(session.start)} から {activeTime}</p>
          ) : null}
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <button onClick={onStart} disabled={isActiveToday} className="btn btn-primary w-100">
            勤務開始
          </button>
        </div>
        <div className="col-12 col-md-6">
          <button onClick={onEnd} disabled={!isActiveToday} className="btn btn-danger w-100">
            勤務終了
          </button>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5 card-title">本日の記録</h2>
          {todayRecords.length === 0 ? (
            <p className="card-text">本日の保存された勤務はまだありません。</p>
          ) : (
            <ul className="list-group list-group-flush">
              {todayRecords.map((record) => (
                <li key={record.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <span>{formatTime(record.start)} - {formatTime(record.end)}</span>
                  <span className="badge bg-primary rounded-pill">{formatDuration(record.durationMs)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default AttendancePage
