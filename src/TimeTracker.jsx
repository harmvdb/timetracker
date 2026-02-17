import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import EditModal from './EditModal'
import DotMatrix from './DotMatrix'

export default function TimeTracker({ session }) {
  const handleLogout = async () => { await supabase.auth.signOut() }

  const [isRunning, setIsRunning]           = useState(false)
  const [currentEntry, setCurrentEntry]     = useState(null)
  const [startedAt, setStartedAt]           = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [todayEntries, setTodayEntries]     = useState([])
  const [loading, setLoading]               = useState(true)
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [projectName, setProjectName]       = useState('')
  const [editEntry, setEditEntry]           = useState(null)

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
      const activeEntry = data?.find(e => !e.end_time)
      if (activeEntry) {
        setCurrentEntry(activeEntry)
        const raw = activeEntry.start_time
        const iso = raw.endsWith('Z') || raw.includes('+') ? raw : raw + 'Z'
        setStartedAt(new Date(iso).getTime())
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
      const calc = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)))
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
      const { data: { user } } = await supabase.auth.getUser()
      const insertData = {
        user_id: user.id,
        start_time: new Date(clickedAt).toISOString(),
        end_time: null,
        duration_seconds: 0,
      }
      const parsed = parseInt(estimatedMinutes, 10)
      if (!isNaN(parsed) && parsed > 0) insertData.estimated_minutes = parsed
      const trimmed = projectName.trim()
      if (trimmed) insertData.project_name = trimmed

      const { data, error } = await supabase
        .from('time_entries').insert([insertData]).select().single()
      if (error) throw error

      setCurrentEntry(data)
      setStartedAt(clickedAt)
      setIsRunning(true)
      setElapsedSeconds(0)
      setEstimatedMinutes('')
      setProjectName('')
    } catch (err) {
      console.error('Fout bij starten:', err.message)
      alert('Kon timer niet starten. Check de console voor details.')
    }
  }

  // ── Stop ──────────────────────────────────────────────────────────────────
  const handleStop = async () => {
    if (!currentEntry) return
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: new Date().toISOString(),
          duration_seconds: Math.floor((Date.now() - startedAt) / 1000),
        })
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
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}u ${m}m`
    return `${m}m`
  }

  const formatDateTime = (iso) => {
    const raw = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z'
    return new Date(raw).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  }

  const estimatedProgress = () => {
    if (!currentEntry?.estimated_minutes) return null
    return Math.min(100, Math.round((elapsedSeconds / (currentEntry.estimated_minutes * 60)) * 100))
  }

  // ── Groepeer entries per project ──────────────────────────────────────────
  const groupedEntries = () => {
    const groups = {}   // key = projectnaam of '' voor geen project
    todayEntries.forEach(entry => {
      const key = entry.project_name || ''
      if (!groups[key]) groups[key] = []
      groups[key].push(entry)
    })

    // Sorteer: projecten met een naam alfabetisch, lege naam altijd onderaan
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === '' && b !== '') return 1
      if (a !== '' && b === '') return -1
      return a.localeCompare(b)
    })
  }

  const groupTotal = (entries) => {
    let total = 0
    entries.forEach(entry => {
      if (entry.duration_seconds) total += entry.duration_seconds
      else if (!entry.end_time) total += Math.floor((Date.now() - new Date(entry.start_time)) / 1000)
    })
    return total
  }

  const totalSeconds = groupTotal(todayEntries)
  const progress     = estimatedProgress()

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <div className="container"><div className="loading">LADEN</div></div>

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

      {/* ── Timer ── */}
      <div className="timer-display">
        <div className="timer-row">
          <div className="time">
            <DotMatrix text={formatTime(elapsedSeconds)} active={isRunning} />
          </div>
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

        {/* Invoervelden: alleen als timer NIET loopt */}
        {!isRunning && (
          <div className="pre-start-fields">
            <div className="pre-start-row">
              <label className="estimate-label">PROJECT</label>
              <input
                className="estimate-input project-input"
                type="text"
                placeholder="naam"
                maxLength={60}
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleStart() }}
              />
            </div>
            <div className="pre-start-row">
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
          </div>
        )}

        {/* Project indicator als timer loopt en project ingevuld is */}
        {isRunning && currentEntry?.project_name && (
          <div className="running-project">{currentEntry.project_name}</div>
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

      {/* ── Sessies gegroepeerd per project ── */}
      <div className="entries-section">
        <span className="label">SESSIES</span>
        {todayEntries.length === 0 ? (
          <p className="no-entries">Geen sessies vandaag</p>
        ) : (
          groupedEntries().map(([projectKey, entries]) => (
            <div key={projectKey || '__geen__'} className="project-group">
              <div className="project-group-header">
                <span className="project-group-name">
                  {projectKey || <span className="project-group-none">—</span>}
                </span>
                <span className="project-group-total">{formatDuration(groupTotal(entries))}</span>
              </div>

              <div className="entries-list">
                {entries.map(entry => (
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
                        {!entry.end_time && <span className="running-badge">LIVE</span>}
                      </div>
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
                      {entry.end_time && (
                        <button className="btn-edit" onClick={() => setEditEntry(entry)} title="Eindtijd aanpassen">✎</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {editEntry && (
        <EditModal
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSaved={async () => { setEditEntry(null); await fetchTodayEntries() }}
        />
      )}
    </div>
  )
}
