-- Time Tracker Database Setup (met Auth)
-- Voer dit script uit in je Supabase SQL Editor

-- Maak de time_entries tabel (met user_id voor RLS)
CREATE TABLE IF NOT EXISTS time_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index voor snelle queries
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time
ON time_entries(start_time DESC);

CREATE INDEX IF NOT EXISTS idx_time_entries_user_id
ON time_entries(user_id);

-- Row Level Security aan
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Verwijder oude open policy als die bestaat
DROP POLICY IF EXISTS "Allow all access" ON time_entries;

-- Alleen de ingelogde gebruiker ziet en bewerkt zijn eigen entries
CREATE POLICY "Own entries only" ON time_entries
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
