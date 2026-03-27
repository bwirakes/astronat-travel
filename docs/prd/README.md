# Astronat — Product Requirements

> **Hard Deadline:** Core MVP live by **April 10, 2026**. Polish complete by **June 30, 2026**.

## What to Read First

1. **[MVP Requirements](./mvp-requirements.md)** — The master PRD. Transaction loop, tech stack decisions, success metrics, and timeline.
2. **[Onboarding Flow](./onboarding-flow.md)** — Detailed 6-screen onboarding spec (Welcome → Birth → Aha → Goals → Destination → Pay Gate).

## All Documents

| Document | Status | Description |
|----------|--------|-------------|
| [mvp-requirements.md](./mvp-requirements.md) | 📋 Draft | Master PRD — auth, payments, onboarding, email, persistence |
| [onboarding-flow.md](./onboarding-flow.md) | 📋 Draft | 6-screen progressive onboarding wizard with data model |
| [analysis-layers.md](./analysis-layers.md) | ✅ Active | 5 astrological data layers — geodetic, ACG, transits, country charts, Gemini prompts |
| [scoring-rubric.md](./scoring-rubric.md) | ✅ Active | Full computation rubric — 12 scoring steps, API overview, 2 worked examples |

## Feature Status

| Feature | PRD Section | Build Status |
|---------|-------------|-------------|
| Auth (Google OAuth + Magic Link) | mvp-requirements §Stage 1 | ❌ Not started |
| Onboarding Wizard (6 screens) | onboarding-flow | 🟡 Mockup exists |
| Paywall (Stripe Checkout) | mvp-requirements §Stage 1 | ❌ Not started |
| Post-Purchase Email (Resend) | mvp-requirements §Stage 1 | ❌ Not started |
| Profile Persistence (Supabase) | mvp-requirements §Stage 1 | ❌ Not started |
| Scoring Engine | scoring-rubric | ✅ Built |
| Analysis Layers (5-layer system) | analysis-layers | 🟡 Partial |
| Unified Design System | mvp-requirements §Stage 2 | 🟡 In progress |
