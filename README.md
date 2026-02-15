# ⏱️ Time Tracker App

Een moderne time tracking applicatie gebouwd met React en Supabase.

## Features

- ▶️ **START/STOP knop** - Start en stop je werksessies met één klik
- ⏰ **Live timer** - Ziet de tijd in real-time tellen (seconden)
- 📊 **Dagelijks overzicht** - Zie al je sessies van vandaag
- 📈 **Totale tijd** - Automatische berekening van totale werktijd vandaag
- 💾 **Persistente opslag** - Alle data wordt opgeslagen in Supabase

## Vereisten

- Node.js (versie 18 of hoger)
- Een Supabase account (gratis op [supabase.com](https://supabase.com))

## Supabase Setup

### 1. Maak een Supabase project

1. Ga naar [supabase.com](https://supabase.com) en maak een account
2. Klik op "New Project"
3. Vul de project details in en wacht tot het project klaar is

### 2. Maak de database tabel

Ga naar je Supabase dashboard → SQL Editor en voer deze query uit:

```sql
-- Maak de time_entries tabel
CREATE TABLE time_entries (
  id BIGSERIAL PRIMARY KEY,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voeg een index toe voor snellere queries
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time DESC);

-- Optioneel: Zet Row Level Security aan (RLS)
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Maak een policy die iedereen toestaat alles te doen (alleen voor development!)
-- Voor productie wil je dit aanpassen met authenticatie
CREATE POLICY "Allow all access" ON time_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 3. Haal je API credentials op

1. Ga naar Project Settings → API
2. Kopieer je:
   - **Project URL** (onder "Project URL")
   - **anon/public key** (onder "Project API keys")

## Installatie

### 1. Clone of download dit project

```bash
cd time-tracker
```

### 2. Installeer dependencies

```bash
npm install
```

### 3. Configureer environment variabelen

Maak een `.env` bestand in de root van het project:

```bash
cp .env.example .env
```

Open `.env` en vul je Supabase credentials in:

```env
VITE_SUPABASE_URL=https://jouwproject.supabase.co
VITE_SUPABASE_ANON_KEY=jouw_anon_key_hier
```

## Development

Start de development server:

```bash
npm run dev
```

Open je browser op `http://localhost:5173`

## Productie Build

Bouw de app voor productie:

```bash
npm run build
```

De geoptimaliseerde bestanden staan in de `dist/` folder.

Preview de productie build:

```bash
npm run preview
```

## Deployment

### Vercel

1. Installeer Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Voeg je environment variabelen toe in de Vercel dashboard

### Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Voeg environment variabelen toe in Netlify settings

### Andere platformen

De app kan gedeployed worden op elk platform dat static sites ondersteunt:
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront
- Firebase Hosting

Zorg ervoor dat je de environment variabelen configureert op je hosting platform.

## Database Schema

```
time_entries
├── id (BIGSERIAL, PRIMARY KEY)
├── start_time (TIMESTAMPTZ, NOT NULL)
├── end_time (TIMESTAMPTZ, nullable)
├── duration_seconds (INTEGER)
└── created_at (TIMESTAMPTZ)
```

## Technologie Stack

- **React 18** - UI framework
- **Vite** - Build tool en dev server
- **Supabase** - Backend-as-a-Service (database)
- **CSS3** - Styling met gradients en animaties

## Features in Detail

### Timer Functionaliteit
- Klikt START om een nieuwe sessie te beginnen
- De timer begint direct te tellen in seconden
- Klikt STOP om de sessie te beëindigen
- Duration wordt automatisch berekend en opgeslagen

### Sessie Overzicht
- Toont alle sessies van vandaag (vanaf 00:00)
- Actieve sessies worden groen gemarkeerd
- Tijden worden weergegeven in Nederlands formaat (uu:mm:ss)
- Automatische refresh na elke start/stop actie

### Totaal Berekening
- Telt alle afgeronde sessies op
- Inclusief de huidige lopende sessie
- Wordt weergegeven in uren en minuten (bijv. "2u 34m")

## Troubleshooting

### Foutmelding: "Supabase URL en ANON KEY zijn verplicht"
- Check of je `.env` bestand bestaat
- Controleer of de variabelen beginnen met `VITE_`
- Herstart de dev server na het aanpassen van `.env`

### Timer start niet
- Open de browser console (F12)
- Check of er database fouten zijn
- Verifieer dat de Supabase tabel correct is aangemaakt
- Controleer of RLS policies correct zijn ingesteld

### Geen sessies zichtbaar
- Check de browser console voor errors
- Verifieer dat de database queries werken in Supabase dashboard
- Controleer of er data in de tabel staat via SQL Editor

## Licentie

MIT - Vrij te gebruiken voor persoonlijke en commerciële projecten.
