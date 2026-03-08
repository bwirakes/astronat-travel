# astronat-travel

Astrocartography travel planning app built with Next.js + Gemini AI.

Enter your birth details → pick a destination → get a personalised astrocartography reading with planetary lines, 12-month transit windows, and a Gemini-powered travel narrative.

## Stack
- **Frontend**: Next.js 16 (App Router) + Framer Motion
- **AI**: Gemini Flash Lite (streaming readings)
- **Astro engine**: Swiss Ephemeris (FastAPI on Digital Ocean `139.59.112.132`)
- **Map**: Leaflet (dark CartoDB tiles, planetary line visualisation)

## Dev setup
```bash
bun install
bun run dev
```

Requires `.env.local`:
```
GEMINI_API_KEY=...
ASTRO_ENGINE_URL=http://139.59.112.132
```

SSH access to engine: `ssh root@139.59.112.132`

Engine logs: `journalctl -u astro-rest -f`

## Vercel deployment

Set these environment variables in the Vercel dashboard (Settings → Environment Variables):
- `GEMINI_API_KEY` — your Gemini API key
- `ASTRO_ENGINE_URL` — `http://139.59.112.132`
