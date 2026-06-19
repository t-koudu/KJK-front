import { useState } from 'react'
import { formatDate, formatDuration, formatTime } from '../utils/attendanceStorage'

function HistoryPage({ records, session, onNavigate, onLogout }) {
  // `records` is groups: [{id,date,records:[]}, ...]
  const [expandedDate, setExpandedDate] = useState(null)
  const groups = (records || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const toggle = (date) => {
    setExpandedDate((prev) => (prev === date ? null : date))
  }

  const hasAny = groups.some((g) => (g.records || []).length > 0)

  return (
    <div className="app">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">勤務時間の確認</h1>
          <p className="text-muted mb-0">日付ごとの要約をクリックすると、その日の詳細を表示します。</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={onLogout}>
          ログアウト
        </button>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          {!hasAny ? (
            <p className="card-text">まだ保存された勤務記録はありません。</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>日付</th>
                    <th>勤務開始</th>
                    <th>勤務終了</th>
                    <th>合計時間</th>
                    <th>件数</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => {
                    let dayRecords = g.records || []
                    if (session && session.date === g.date) {
                      dayRecords = [...dayRecords, session]
                    }

                    const startTimes = dayRecords.map((r) => new Date(r.start).getTime()).filter(Boolean)
                    const firstStartMs = startTimes.length > 0 ? Math.min(...startTimes) : null
                    const firstStart = firstStartMs ? new Date(firstStartMs) : null

                    const endTimes = dayRecords.map((r) => (r.end ? new Date(r.end).getTime() : null)).filter(Boolean)
                    let lastEndMs = endTimes.length > 0 ? Math.max(...endTimes) : null
                    const hasActive = dayRecords.some((r) => r.start && !r.end)
                    if (hasActive) {
                      lastEndMs = Math.max(lastEndMs || 0, Date.now())
                    }
                    const lastEnd = lastEndMs ? new Date(lastEndMs) : null
                    const totalMs = firstStart && lastEnd ? Math.max(0, lastEndMs - firstStartMs) : 0

                    return (
                      <>
                        <tr key={g.id || g.date} style={{ cursor: 'pointer' }} onClick={() => toggle(g.date)}>
                          <td>{formatDate(g.date)}</td>
                          <td>{firstStart ? formatTime(firstStart.toISOString()) : 'ー'}</td>
                          <td>{lastEnd ? (hasActive ? '勤務中' : formatTime(lastEnd.toISOString())) : 'ー'}</td>
                          <td>{formatDuration(totalMs)}</td>
                          <td>{dayRecords.length} 件</td>
                        </tr>
                        {expandedDate === g.date ? (
                          <tr key={`${g.id || g.date}-details`}>
                            <td colSpan={5}>
                              {dayRecords.length === 0 ? (
                                <div className="text-muted">この日の記録はありません。</div>
                              ) : (
                                <table className="table mb-0">
                                  <thead>
                                    <tr>
                                      <th>開始</th>
                                      <th>終了</th>
                                      <th>時間</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {dayRecords.map((record) => (
                                      <tr key={record.id}>
                                        <td>{formatTime(record.start)}</td>
                                        <td>{record.end ? formatTime(record.end) : '勤務中'}</td>
                                        <td>{formatDuration(record.durationMs != null ? record.durationMs : (record.end ? new Date(record.end).getTime() - new Date(record.start).getTime() : Date.now() - new Date(record.start).getTime()))}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <button className="btn btn-outline-primary w-100" onClick={onNavigate}>
        勤怠入力ページに戻る
      </button>
    </div>
  )
}

export default HistoryPage
