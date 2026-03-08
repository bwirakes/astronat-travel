# astronat-travel

Astrocartography travel planning app built with Next.js + Gemini AI.

Enter your birth details → pick a destination → get a personalised astrocartography reading with planetary lines, 12-month transit windows, and a Gemini-powered travel narrative.

## Stack
- **Frontend**: Next.js 16 (App Router) + Framer Motion
- **AI**: Gemini 2.0 Flash Lite (streaming readings)
- **Astro engine**: Swiss Ephemeris (FastAPI on Digital Ocean)
- **Map**: Leaflet (dark CartoDB tiles, planetary line visualisation)

## Dev setup
```bash
bun install
bun run dev
```

Requires `.env.local`:
```
GEMINI_API_KEY=...
ASTRO_ENGINE_URL=http://127.0.0.1:8788
```

SSH tunnel to engine: `ssh -L 8788:127.0.0.1:8788 root@139.59.112.132`
