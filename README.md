# Astronat

Astrocartography travel planning app built with Next.js, Expo, Supabase, and Gemini AI.

Enter your birth details → pick a destination → get a personalised astrocartography reading with planetary lines, 12-month transit windows, and a Gemini-powered travel narrative.

## Stack
- **Web**: `apps/web` — Next.js 16 (App Router) + Framer Motion
- **Mobile**: `apps/mobile` — Expo SDK 55 + Expo Router
- **Shared**: `packages/core` — platform-neutral contracts and brand tokens
- **AI**: Gemini Flash Lite (streaming readings)
- **Astro engine**: Swiss Ephemeris (FastAPI on Digital Ocean `139.59.112.132`)
- **Map**: Leaflet (dark CartoDB tiles, planetary line visualisation)

## Dev setup
```bash
bun install
bun run dev
```

Run the native app in parallel:

```bash
bun run dev:mobile
bun run ios
bun run android
```

For mobile API calls, set `EXPO_PUBLIC_API_BASE_URL` to the web app origin, for example `http://localhost:3000`.

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
