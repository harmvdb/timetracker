import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Login() {
  const [mode, setMode] = useState('login')        // 'login' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)     // { type: 'error'|'success', text }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage({ type: 'error', text: 'Onjuist e-mailadres of wachtwoord.' })
    }
    // Bij succes detecteert App.jsx de sessie automatisch via onAuthStateChange
    setLoading(false)
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })

    if (error) {
      setMessage({ type: 'error', text: 'Kon geen herstel-e-mail sturen. Controleer het adres.' })
    } else {
      setMessage({ type: 'success', text: 'Check je inbox — een herstellink is onderweg.' })
    }
    setLoading(false)
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <div className="auth-header">
          <span className="header-dot" />
          <span className="auth-title">TIME TRACKER</span>
        </div>

        {mode === 'login' && (
          <>
            <p className="auth-label">INLOGGEN</p>
            <form onSubmit={handleLogin} className="auth-form">
              <div className="field">
                <label className="field-label">E-MAIL</label>
                <input
                  className="field-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>
              <div className="field">
                <label className="field-label">WACHTWOORD</label>
                <input
                  className="field-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {message && (
                <p className={`auth-message auth-message--${message.type}`}>{message.text}</p>
              )}

              <button className="btn btn-start auth-submit" type="submit" disabled={loading}>
                {loading ? 'LADEN...' : 'INLOGGEN'}
              </button>
            </form>

            <button
              className="auth-link"
              onClick={() => { setMode('reset'); setMessage(null) }}
            >
              Wachtwoord vergeten?
            </button>
          </>
        )}

        {mode === 'reset' && (
          <>
            <p className="auth-label">WACHTWOORD HERSTELLEN</p>
            <form onSubmit={handleReset} className="auth-form">
              <div className="field">
                <label className="field-label">E-MAIL</label>
                <input
                  className="field-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>

              {message && (
                <p className={`auth-message auth-message--${message.type}`}>{message.text}</p>
              )}

              <button className="btn btn-start auth-submit" type="submit" disabled={loading}>
                {loading ? 'LADEN...' : 'STUUR HERSTELLINK'}
              </button>
            </form>

            <button
              className="auth-link"
              onClick={() => { setMode('login'); setMessage(null) }}
            >
              Terug naar inloggen
            </button>
          </>
        )}
      </div>
    </div>
  )
}
