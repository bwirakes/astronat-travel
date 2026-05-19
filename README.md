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

### Reliability and security environment

Optional locally, recommended in staging/production:
- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` — error inbox and source map upload
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — cross-instance API rate limiting
- `INTERNAL_API_SECRET` or `CRON_SECRET` — protects internal/deep health checks and internal email dispatch
- `NEXT_PUBLIC_POSTHOG_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST` — product analytics and AI telemetry
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SINGLE_PRICE_ID`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_LIFETIME_PRICE_ID` — checkout and webhook access sync
