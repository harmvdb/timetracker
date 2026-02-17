import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

// Zet een ISO-string om naar "HH:MM" voor in het time-input veld
function toTimeInput(isoString) {
  const d = new Date(isoString)
  return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// Combineer de datum van het origineel met een nieuwe "HH:MM" tijd → ISO string
function buildUpdatedISO(originalISO, newTime) {
  const original = new Date(originalISO)
  const [h, m] = newTime.split(':').map(Number)
  const updated = new Date(original)
  updated.setHours(h, m, 0, 0)
  return updated.toISOString()
}

export default function EditModal({ entry, onClose, onSaved }) {
  const [endTime, setEndTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (entry?.end_time) {
      setEndTime(toTimeInput(entry.end_time))
    }
    // Sluit modal op Escape
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [entry, onClose])

  const handleSave = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const newEndISO = buildUpdatedISO(entry.end_time, endTime)
    const newEnd = new Date(newEndISO)
    const start = new Date(entry.start_time)

    if (newEnd <= start) {
      setError('Eindtijd moet na de starttijd liggen.')
      setSaving(false)
      return
    }

    const durationSeconds = Math.floor((newEnd - start) / 1000)

    const { error: supaError } = await supabase
      .from('time_entries')
      .update({ end_time: newEndISO, duration_seconds: durationSeconds })
      .eq('id', entry.id)

    if (supaError) {
      setError('Opslaan mislukt. Probeer opnieuw.')
      setSaving(false)
      return
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <p className="modal-label">EINDTIJD AANPASSEN</p>

        <div className="modal-meta">
          <span>Start</span>
          <span className="modal-value">{toTimeInput(entry.start_time)}</span>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          <div className="field">
            <label className="field-label">EINDTIJD</label>
            <input
              className="field-input"
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              required
              autoFocus
            />
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="submit" className="btn btn-start" disabled={saving}>
              {saving ? 'OPSLAAN...' : 'OPSLAAN'}
            </button>
            <button type="button" className="btn-text" onClick={onClose}>
              ANNULEREN
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
