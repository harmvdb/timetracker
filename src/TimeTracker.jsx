import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function TimeTracker({ session }) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }
  const [isRunning, setIsRunning] = useState(false)
  const [currentEntry, setCurrentEntry] = useState(null)
  const [startedAt, setStartedAt] = useState(null)   // client-side Date object, betrouwbaar
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [todayEntries, setTodayEntries] = useState([])
  const [loading, setLoading] = useState(true)

  // Haal alle entries van vandaag op
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

      // Check of er een actieve entry is (zonder end_time)
      const activeEntry = data?.find(entry => !entry.end_time)
      if (activeEntry) {
        setCurrentEntry(activeEntry)
        // Zorg dat de timestamp altijd als UTC geparsed wordt (voeg Z toe als die ontbreekt)
        const rawStart = activeEntry.start_time
        const isoStart = rawStart.endsWith('Z') || rawStart.includes('+') ? rawStart : rawStart + 'Z'
        setStartedAt(new Date(isoStart).getTime())
        setIsRunning(true)
      }
    } catch (error) {
      console.error('Fout bij ophalen entries:', error.message)
    } finally {
      setLoading(false)
    }
  }

  // Bij opstarten: haal entries op
  useEffect(() => {
    fetchTodayEntries()
  }, [])

  // Timer die elke seconde tikt
  // Gebruikt startedAt (client-side Date) om tijdzone-issues met Supabase strings te vermijden
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

  // Start knop
  const handleStart = async () => {
    try {
      const clickedAt = Date.now()           // bewaar exact moment van klikken
      const nowISO = new Date(clickedAt).toISOString()

      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('time_entries')
        .insert([
          {
            user_id: user.id,
            start_time: nowISO,
            end_time: null,
            duration_seconds: 0
          }
        ])
        .select()
        .single()

      if (error) throw error

      setCurrentEntry(data)
      setStartedAt(clickedAt)               // gebruik client-side timestamp, niet Supabase string
      setIsRunning(true)
      setElapsedSeconds(0)
    } catch (error) {
      console.error('Fout bij starten:', error.message)
      alert('Kon timer niet starten. Check de console voor details.')
    }
  }

  // Stop knop
  const handleStop = async () => {
    if (!currentEntry) return

    try {
      const now = new Date().toISOString()
      const start = new Date(currentEntry.start_time)
      const end = new Date(now)
      const durationSeconds = Math.floor((end - start) / 1000)

      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: now,
          duration_seconds: durationSeconds
        })
        .eq('id', currentEntry.id)

      if (error) throw error

      setIsRunning(false)
      setCurrentEntry(null)
      setStartedAt(null)
      setElapsedSeconds(0)

      // Refresh de lijst
      await fetchTodayEntries()
    } catch (error) {
      console.error('Fout bij stoppen:', error.message)
      alert('Kon timer niet stoppen. Check de console voor details.')
    }
  }

  // Bereken totale tijd vandaag
  const calculateTotalTime = () => {
    let total = 0

    todayEntries.forEach(entry => {
      if (entry.duration_seconds) {
        total += entry.duration_seconds
      } else if (entry.start_time && !entry.end_time) {
        // Actieve entry
        const start = new Date(entry.start_time)
        const now = new Date()
        total += Math.floor((now - start) / 1000)
      }
    })

    return total
  }

  // Format seconden naar mm:ss of uu:mm:ss (uur alleen tonen als >= 3600s)
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Format seconden naar leesbare tekst
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)

    if (hrs > 0) {
      return `${hrs}u ${mins}m`
    }
    return `${mins}m`
  }

  // Format datum/tijd
  const formatDateTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const totalSeconds = calculateTotalTime()

  if (loading) {
    return (
      <div className="container">
        <div className="loading">LADEN</div>
      </div>
    )
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

      <div className="timer-display">
        <div className={`time ${isRunning ? 'time--running' : ''}`}>
          {formatTime(elapsedSeconds)}
        </div>
        <button
          className={`btn ${isRunning ? 'btn-stop' : 'btn-start'}`}
          onClick={isRunning ? handleStop : handleStart}
        >
          {isRunning ? 'STOP' : 'START'}
        </button>
      </div>

      <div className="divider" />

      <div className="total-section">
        <span className="label">VANDAAG</span>
        <div className="total-time">{formatDuration(totalSeconds)}</div>
      </div>

      <div className="divider" />

      <div className="entries-section">
        <span className="label">SESSIES</span>
        {todayEntries.length === 0 ? (
          <p className="no-entries">Geen sessies vandaag</p>
        ) : (
          <div className="entries-list">
            {todayEntries.map(entry => (
              <div key={entry.id} className={`entry ${!entry.end_time ? 'active' : ''}`}>
                <div className="entry-time">
                  <span className="start">{formatDateTime(entry.start_time)}</span>
                  {entry.end_time && (
                    <>
                      <span className="separator">—</span>
                      <span className="end">{formatDateTime(entry.end_time)}</span>
                    </>
                  )}
                  {!entry.end_time && (
                    <span className="running-badge">LIVE</span>
                  )}
                </div>
                <div className="entry-duration">
                  {entry.end_time
                    ? formatDuration(entry.duration_seconds)
                    : formatDuration(Math.floor((new Date() - new Date(entry.start_time)) / 1000))
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
