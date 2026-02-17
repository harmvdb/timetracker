import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import EditModal from './EditModal'

export default function TimeTracker({ session }) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const [isRunning, setIsRunning]         = useState(false)
  const [currentEntry, setCurrentEntry]   = useState(null)
  const [startedAt, setStartedAt]         = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [todayEntries, setTodayEntries]   = useState([])
  const [loading, setLoading]             = useState(true)

  // Schatting: alleen zichtbaar vóór de start, facultatief
  const [estimatedMinutes, setEstimatedMinutes] = useState('')

  // Edit modal
  const [editEntry, setEditEntry] = useState(null)   // entry die bewerkt wordt, of null

  // ── Data ophalen ──────────────────────────────────────────────────────────
  const fetchTodayEntries = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .gte('start_time', today.toISOString())
        .order('start_time', { ascending: false })

      if (error) throw error

      setTodayEntries(data || [])

      const activeEntry = data?.find(entry => !entry.end_time)
      if (activeEntry) {
        setCurrentEntry(activeEntry)
        const rawStart = activeEntry.start_time
        const isoStart = rawStart.endsWith('Z') || rawStart.includes('+') ? rawStart : rawStart + 'Z'
        setStartedAt(new Date(isoStart).getTime())
        setIsRunning(true)
      }
    } catch (err) {
      console.error('Fout bij ophalen entries:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTodayEntries() }, [])

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let interval
    if (isRunning && startedAt) {
      const calc = () => {
        const seconds = Math.floor((Date.now() - startedAt) / 1000)
        setElapsedSeconds(Math.max(0, seconds))
      }
      calc()
      interval = setInterval(calc, 1000)
    } else {
      setElapsedSeconds(0)
    }
    return () => clearInterval(interval)
  }, [isRunning, startedAt])

  // ── Start ─────────────────────────────────────────────────────────────────
  const handleStart = async () => {
    try {
      const clickedAt = Date.now()
      const nowISO    = new Date(clickedAt).toISOString()

      const { data: { user } } = await supabase.auth.getUser()

      const insertData = {
        user_id:    user.id,
        start_time: nowISO,
        end_time:   null,
        duration_seconds: 0,
      }

      // Schatting meesturen als die ingevuld is
      const parsed = parseInt(estimatedMinutes, 10)
      if (!isNaN(parsed) && parsed > 0) {
        insertData.estimated_minutes = parsed
      }

      const { data, error } = await supabase
        .from('time_entries')
        .insert([insertData])
        .select()
        .single()

      if (error) throw error

      setCurrentEntry(data)
      setStartedAt(clickedAt)
      setIsRunning(true)
      setElapsedSeconds(0)
      setEstimatedMinutes('')     // leeg maken na start
    } catch (err) {
      console.error('Fout bij starten:', err.message)
      alert('Kon timer niet starten. Check de console voor details.')
    }
  }

  // ── Stop ──────────────────────────────────────────────────────────────────
  const handleStop = async () => {
    if (!currentEntry) return
    try {
      const now             = new Date().toISOString()
      const start           = new Date(currentEntry.start_time)
      const end             = new Date(now)
      const durationSeconds = Math.floor((end - start) / 1000)

      const { error } = await supabase
        .from('time_entries')
        .update({ end_time: now, duration_seconds: durationSeconds })
        .eq('id', currentEntry.id)

      if (error) throw error

      setIsRunning(false)
      setCurrentEntry(null)
      setStartedAt(null)
      setElapsedSeconds(0)
      await fetchTodayEntries()
    } catch (err) {
      console.error('Fout bij stoppen:', err.message)
      alert('Kon timer niet stoppen. Check de console voor details.')
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const calculateTotalTime = () => {
    let total = 0
    todayEntries.forEach(entry => {
      if (entry.duration_seconds) {
        total += entry.duration_seconds
      } else if (entry.start_time && !entry.end_time) {
        total += Math.floor((Date.now() - new Date(entry.start_time)) / 1000)
      }
    })
    return total
  }

  const formatTime = (seconds) => {
    const hrs  = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`
    }
    return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`
  }

  const formatDuration = (seconds) => {
    const hrs  = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hrs > 0) return `${hrs}u ${mins}m`
    return `${mins}m`
  }

  const formatDateTime = (isoString) => {
    const d = new Date(isoString)
    return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  // Voortgangspercentage t.o.v. schatting (0-100)
  const estimatedProgress = () => {
    if (!currentEntry?.estimated_minutes) return null
    const estimatedSeconds = currentEntry.estimated_minutes * 60
    return Math.min(100, Math.round((elapsedSeconds / estimatedSeconds) * 100))
  }

  const totalSeconds = calculateTotalTime()
  const progress     = estimatedProgress()

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="container"><div className="loading">LADEN</div></div>
  }

  return (
    <div className="container">
      <header className="header">
        <span className="header-dot" />
        <h1>TIME TRACKER</h1>
        <div className="header-right">
          <span className="header-email">{session?.user?.email}</span>
          <button className="btn-logout" onClick={handleLogout}>UITLOGGEN</button>
        </div>
      </header>

      {/* ── Timer sectie ── */}
      <div className="timer-display">
        <div className="timer-row">
          <div className={`time ${isRunning ? 'time--running' : ''}`}>
            {formatTime(elapsedSeconds)}
          </div>
          {/* Schatting indicator als de timer loopt */}
          {isRunning && currentEntry?.estimated_minutes && (
            <span className="estimate-badge">
              / {currentEntry.estimated_minutes}m
              {progress !== null && (
                <span className={`estimate-pct ${progress >= 100 ? 'estimate-pct--over' : ''}`}>
                  {progress}%
                </span>
              )}
            </span>
          )}
        </div>

        {/* Schattingsveld: alleen zichtbaar als timer NIET loopt */}
        {!isRunning && (
          <div className="estimate-input-row">
            <label className="estimate-label">SCHATTING</label>
            <div className="estimate-input-wrap">
              <input
                className="estimate-input"
                type="number"
                min="1"
                max="480"
                placeholder="min"
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(e.target.value)}
              />
              {estimatedMinutes && (
                <span className="estimate-preview">
                  = {Math.floor(estimatedMinutes / 60) > 0
                    ? `${Math.floor(estimatedMinutes / 60)}u ${estimatedMinutes % 60}m`
                    : `${estimatedMinutes}m`}
                </span>
              )}
            </div>
          </div>
        )}

        <button
          className={`btn ${isRunning ? 'btn-stop' : 'btn-start'}`}
          onClick={isRunning ? handleStop : handleStart}
        >
          {isRunning ? 'STOP' : 'START'}
        </button>
      </div>

      <div className="divider" />

      {/* ── Totaal ── */}
      <div className="total-section">
        <span className="label">VANDAAG</span>
        <div className="total-time">{formatDuration(totalSeconds)}</div>
      </div>

      <div className="divider" />

      {/* ── Sessie lijst ── */}
      <div className="entries-section">
        <span className="label">SESSIES</span>
        {todayEntries.length === 0 ? (
          <p className="no-entries">Geen sessies vandaag</p>
        ) : (
          <div className="entries-list">
            {todayEntries.map(entry => (
              <div key={entry.id} className={`entry ${!entry.end_time ? 'active' : ''}`}>
                <div className="entry-left">
                  <div className="entry-time">
                    <span>{formatDateTime(entry.start_time)}</span>
                    {entry.end_time && (
                      <>
                        <span className="separator">—</span>
                        <span>{formatDateTime(entry.end_time)}</span>
                      </>
                    )}
                    {!entry.end_time && (
                      <span className="running-badge">LIVE</span>
                    )}
                  </div>
                  {/* Schatting onder de tijdregel als die er is */}
                  {entry.estimated_minutes && (
                    <div className="entry-estimate">
                      geschat {entry.estimated_minutes}m
                      {entry.duration_seconds > 0 && (() => {
                        const diff = entry.duration_seconds - entry.estimated_minutes * 60
                        if (Math.abs(diff) < 30) return null
                        const sign = diff > 0 ? '+' : '−'
                        return (
                          <span className={`entry-estimate-diff ${diff > 0 ? 'over' : 'under'}`}>
                            {sign}{formatDuration(Math.abs(diff))}
                          </span>
                        )
                      })()}
                    </div>
                  )}
                </div>

                <div className="entry-right">
                  <div className="entry-duration">
                    {entry.end_time
                      ? formatDuration(entry.duration_seconds)
                      : formatDuration(Math.floor((Date.now() - new Date(entry.start_time)) / 1000))
                    }
                  </div>
                  {/* Potloodje — alleen bij afgeronde sessies */}
                  {entry.end_time && (
                    <button
                      className="btn-edit"
                      onClick={() => setEditEntry(entry)}
                      title="Eindtijd aanpassen"
                    >
                      ✎
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit modal ── */}
      {editEntry && (
        <EditModal
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSaved={async () => {
            setEditEntry(null)
            await fetchTodayEntries()
          }}
        />
      )}
    </div>
  )
}
