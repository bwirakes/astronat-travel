# Astronat MVP — Product Requirements Document

**Author:** Product  
**Date:** March 27, 2026  
**Status:** Draft — Awaiting Founder Review  
**Hard Deadline:** Core MVP live by **April 10, 2026**. Polish complete by **June 30, 2026**.

---

## The Problem

We have a working astrology calculation engine. What we don't have is a product. No one can sign up, pay, or receive anything. The engine is a car with no doors — powerful, but no one can get in.

## The Insight

The 80/20 for any consumer product is the **transaction loop**: a user arrives → authenticates → provides input → pays → receives value. Every feature outside this loop is polish. We need to close the loop first, then make it beautiful.

## What Exists Today

| Layer | Status | Notes |
|---|---|---|
| Calculation Engine | ✅ Done | `app/lib/scoring.ts`, astrocarto, house-matrix, transits — fully built |
| API Routes | ✅ Done | 10 endpoints under `app/api/` |
| Design System | ⚠️ Fragmented | 3 competing versions (`v1-celestial-editorial`, `v2-modern-minimalist`, `design-system`) |
| Auth | ❌ Missing | No auth library installed |
| Database | ❌ Missing | No persistence layer |
| Payments | ❌ Missing | No Stripe or billing integration |
| Email | ❌ Missing | No transactional email provider |

## What We're NOT Building (Musk Step 2: Delete)

Before adding anything, here's what we're explicitly killing:

- ❌ Custom auth screens with password reset — use OAuth/Magic Link only
- ❌ In-app checkout UI — use Stripe's hosted Checkout
- ❌ Rich HTML email templates — plain text with a link is fine for MVP
- ❌ Admin dashboard — use Stripe Dashboard + Supabase Studio directly
- ❌ Multiple design systems — pick one, delete the rest

> Every "nice to have" we kill now is a week we get back.

## MVP Scope — The Transaction Loop

### Stage 1: Core (March 28 – April 10)

The only question: **Can a stranger land on the site, sign up, pay, and get a reading?**

| # | Feature | Tool | Deadline |
|---|---|---|---|
| 1 | **Auth** — Google OAuth + Magic Link | Supabase Auth | April 1 |
| 2 | **Onboarding** — 3-step wizard (Date → Time → Location) | Shadcn + existing components | April 3 |
| 3 | **Paywall** — Gate full results behind payment | Stripe Checkout Sessions | April 6 |
| 4 | **Post-Purchase Email** — Send results link on payment success | Resend + Stripe Webhooks | April 8 |
| 5 | **Profile Persistence** — Save user birth data & purchase history | Supabase PostgreSQL | April 10 |

**Definition of Done:** One real human (not us) completes the full loop end-to-end.

### Stage 2: Polish (April 11 – June 30)

Only after Stage 1 ships:

| # | Feature | Deadline |
|---|---|---|
| 1 | Unified Astro-Brand design across all screens | April 25 |
| 2 | Email sequences (welcome, re-engagement) | May 9 |
| 3 | Performance optimization (caching heavy calculations) | May 23 |
| 4 | Beta cohort feedback loop + iteration | June 13 |
| 5 | Launch prep (SEO, OG tags, analytics) | June 30 |

## Technical Decisions

| Decision | Choice | Why |
|---|---|---|
| Auth + DB | **Supabase** | Auth, Postgres, and Row-Level Security in one SDK. Already on free tier from cost analysis. |
| Payments | **Stripe Checkout** | Zero custom UI. Hosted page handles cards, Apple Pay, compliance. |
| Email | **Resend** | Simple API, React email support for later, generous free tier. |
| Hosting | **Vercel** | Already deployed. Zero migration cost. |

## Success Metrics

1. **North Star:** First paying stranger completes the full loop
2. **Activation Rate:** % of signups who complete onboarding  
3. **Conversion Rate:** % of onboarded users who pay  
4. **Time to Value:** Minutes from landing to receiving a reading

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Scope creep during "polish" | Stage 2 only begins after Stage 1 DOD is met |
| Design fragmentation | Delete `v1` and `v2` folders on Day 1 |
| Over-engineering email | Ship plain text first, templatize later |

---

## Next Steps

1. **Founder Decision:** Confirm Supabase as Auth/DB provider
2. **Day 1 Action:** Delete redundant design folders, install `@supabase/supabase-js`, `stripe`, `resend`
3. **Day 1 Action:** Set up Supabase project + Stripe account + Resend domain verification
