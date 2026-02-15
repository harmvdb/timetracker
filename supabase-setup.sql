-- Time Tracker Database Setup
-- Voer dit script uit in je Supabase SQL Editor

-- Maak de time_entries tabel
CREATE TABLE IF NOT EXISTS time_entries (
  id BIGSERIAL PRIMARY KEY,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voeg een index toe voor snellere queries op start_time
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time
ON time_entries(start_time DESC);

-- Zet Row Level Security aan
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Verwijder bestaande policies (als ze bestaan)
DROP POLICY IF EXISTS "Allow all access" ON time_entries;

-- Maak een policy die alle operaties toestaat
-- LET OP: Dit is alleen geschikt voor development/persoonlijk gebruik
-- Voor productie met meerdere gebruikers, implementeer authenticatie en user-specific policies
CREATE POLICY "Allow all access" ON time_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optioneel: Maak een view voor today's entries
CREATE OR REPLACE VIEW todays_entries AS
SELECT *
FROM time_entries
WHERE start_time >= CURRENT_DATE
ORDER BY start_time DESC;

-- Test query om te verifiëren dat alles werkt
-- SELECT * FROM time_entries ORDER BY start_time DESC LIMIT 10;
