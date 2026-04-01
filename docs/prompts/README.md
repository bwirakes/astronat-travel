# AI Engineer Prompts — Astronat

This folder contains detailed implementation prompts for each feature in the Astronat roadmap. Each prompt is a self-contained instruction document for an AI coding agent (Cursor, Windsurf, or similar).

## How to Use

1. Open the prompt file for the feature you're working on
2. Read the **"Read These First"** section completely — especially `SKILL.md`
3. Follow the steps in order
4. Use the **Design Checklist** at the bottom to verify before committing

## Shared Context (always available)

| Resource | Path | What it Contains |
|----------|------|-----------------|
| **Astro-Design Skill** | `.agents/skills/astro-design/SKILL.md` | Typography, colors, shapes, SVG assets, component patterns |
| **Design Tokens** | `app/globals.css` | Single source of truth for all CSS variables |
| **Brand Guidelines** | `docs/brand/guidelines.md` | Strategic brand identity |
| **MVP PRD** | `docs/prd/mvp-requirements.md` | Scope, tech decisions, what NOT to build |
| **Onboarding Spec** | `docs/prd/onboarding-flow.md` | 6-screen flow detail |
| **Scoring Rubric** | `docs/prd/scoring-rubric.md` | 12-step engine computation |
| **Analysis Layers** | `docs/prd/analysis-layers.md` | 5-layer data architecture |

## Phase 1 — Auth + Product Flows

| Prompt | Feature | Deadline |
|--------|---------|---------|
| [01-database.md](./01-database.md) | Profile Persistence (Supabase) | May 14 |
| [02-auth.md](./02-auth.md) | Authentication — Login + Signup | April 5 |
| [03-onboarding.md](./03-onboarding.md) | 6-Screen Onboarding Wizard | April 15 |
| [04-app-home.md](./04-app-home.md) | Post-Login App Home | April 10 |
| [05-life-goals.md](./05-life-goals.md) | Life Goals Feature | May 2 |
| [06-birthday-optimizer.md](./06-birthday-optimizer.md) | ~~Birthday Optimizer~~ → Merged into 17 | *reference* |
| [07-couples-family.md](./07-couples-family.md) | ~~Couples & Family~~ → Merged into 17 | *reference* |
| [08-profile.md](./08-profile.md) | User Profile (Birth Data) | May 14 |

## Phase 1 — Mockup Pages (Demo Mode)

| Prompt | Feature | Priority |
|--------|---------|----------|
| [13-shared-components.md](./13-shared-components.md) | Extract Pill, VerdictLabel, Starburst | P0 — Prerequisite |
| [14-reading-results.md](./14-reading-results.md) | Reading Results `/reading/[id]` | P0 |
| [15-reading-history.md](./15-reading-history.md) | Reading History `/readings` | P0 |
| [16-chart-viewer.md](./16-chart-viewer.md) | Natal Chart Viewer `/chart` | P3 |
| [17-new-reading.md](./17-new-reading.md) | **Unified New Reading Wizard** (`/new-reading`) | **P0** |

## Phase 2 — Monetization & Infrastructure

| Prompt | Feature | Deadline |
|--------|---------|---------|
| [09-paywall.md](./09-paywall.md) | Stripe Checkout Paywall | May 20 |
| [10-email.md](./10-email.md) | Transactional Email (Resend) | May 23 |
| [11-performance.md](./11-performance.md) | Caching & Performance | May 27 |
| [12-polish.md](./12-polish.md) | Launch Prep (SEO, Analytics, Policy) | May 30 |

---

**Pilot Launch: June 7, 2026** ⭐
