import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabaseClient'
import Login from './Login'
import TimeTracker from './TimeTracker'

function App() {
  const [session, setSession] = useState(undefined)   // undefined = nog aan het laden

  useEffect(() => {
    // Haal huidige sessie op bij opstarten
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Luister naar login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Nog aan het laden
  if (session === undefined) {
    return (
      <div className="container">
        <div className="loading">LADEN</div>
      </div>
    )
  }

  // Niet ingelogd
  if (!session) {
    return <Login />
  }

  // Ingelogd
  return <TimeTracker session={session} />
}

export default App
