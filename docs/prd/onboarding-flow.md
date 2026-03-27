# Astronat Onboarding — Detailed PRD

**Author:** Product  
**Date:** March 27, 2026  
**Deadline:** Fully functional by **April 3, 2026**  

---

## Why This Matters

Onboarding is the product. It's where we capture identity, birth data, intent, and payment willingness — all in under 90 seconds. The current flow (`app/flow/page.tsx`) skips straight to data input with zero user capture. We don't even collect an email.

**Goal:** Convert a curious stranger into a profiled, paying user before they see full results.

---

## Design Principles (Stolen from the Best)

| Principle | Inspiration | Application to Astronat |
|---|---|---|
| **Value before signup** | Duolingo — you take a lesson before creating an account | Show the user their Sun sign + a 1-line teaser immediately after birth data entry, before asking for email |
| **Progressive disclosure** | Bloom — founder video is skippable, details layer in | Don't dump all fields on one screen. One question per screen. |
| **Personalization feels magical** | Co-Star — "Here's what the stars say about you today" on first open | After birth data, instantly surface a micro-insight so they feel seen |
| **Intent capture = better product** | Klima — "What matters most to you?" drives the entire experience | Life Goals screen drives which houses/transits we prioritize in the reading |
| **Minimal friction** | Dawn — 6 screens, no account needed to start | No signup wall until after the "Aha Moment" |

---

## The Flow: 6 Screens

```
[1. Welcome] → [2. Birth Data] → [3. Aha Moment] → [4. Life Goals] → [5. Destination] → [6. Signup/Pay Gate]
```

### Screen 1: Welcome
**Purpose:** Set the tone. Build trust. Start the journey.

| Element | Detail |
|---|---|
| Headline | *"Where in the world should you be?"* |
| Subtext | 1 line explaining what Astronat does — no jargon |
| CTA | `Get Started →` (no fields, just a button) |
| Data captured | `none` — this is a brand screen |

**Why it exists:** Duolingo & Bloom both use a zero-input welcome screen to prime the user emotionally. It sets expectation and reduces bounce.

---

### Screen 2: Birth Data
**Purpose:** Capture the minimum inputs needed to generate a chart.

| Field | Type | Required | UX Notes |
|---|---|---|---|
| First name | text | ✅ | Used to personalize all outputs ("Brandon, your chart shows…") |
| Date of birth | date picker | ✅ | Native date picker. Default to ~25 years ago for speed. |
| Time of birth | time picker | ✅ | Add helper: *"Check your birth certificate or ask a parent."* Include "I don't know" toggle → defaults to 12:00 noon with a flag |
| City of birth | text (autocomplete) | ✅ | Use geocoding API for lat/lon. Show detected country flag for delight. |

**Micro-interaction:** On date entry, immediately show the detected **Sun sign glyph + name** (already exists in current code via `getSunSign`). This is the first "wow" moment.

**Data captured → DB:**
```
profiles.first_name
profiles.birth_date
profiles.birth_time
profiles.birth_time_known (boolean)
profiles.birth_city
profiles.birth_lat
profiles.birth_lon
```

---

### Screen 3: Aha Moment ✨
**Purpose:** Deliver instant value before asking for anything else. This is the Duolingo "lesson before signup" equivalent.

| Element | Detail |
|---|---|
| Visual | Animated natal chart wheel (already built — `NatalChart` component) |
| Content | 3 personalized bullet points: Sun sign trait, Rising sign trait, Moon sign trait |
| Tone | *"You're a Leo Sun with Aries Rising — fire meets fire. You thrive in places that match your intensity."* |
| CTA | `Show me where →` |

**Why it exists:** The user needs to *feel* the product before they'll give us their email or money. Co-Star nails this — the first screen after birth data is your chart with a personal message.

**Engine dependency:** Calls `/api/natal` on Screen 2 submit (already works). This screen simply renders data that's already fetched.

---

### Screen 4: Life Goals 🎯
**Purpose:** Capture user intent to personalize the reading. This is the feature that separates Astronat from every other astro app.

| Element | Detail |
|---|---|
| Headline | *"What are you looking for?"* |
| Format | Multi-select cards (tap to toggle, max 3) |

**Goal options:**

| Goal | Icon | Maps to (Engine) |
|---|---|---|
| 💕 **Love & Relationships** | Heart | 5th & 7th House rulers, Venus lines, Venus transits |
| 💼 **Career & Ambition** | Briefcase | 10th & 6th House rulers, Saturn/Jupiter lines, MC lines |
| 🤝 **Community & Friendships** | People | 11th & 3rd House rulers, social planet transits |
| ⏱️ **Timing & Life Transitions** | Clock | Active personal transits, profections, travel windows |

**Optional add-on:**
| 🌱 **Personal Growth** | Seedling | 9th & 12th House rulers, Neptune/Jupiter transits |
| 🏠 **Relocation / Living** | Home | 4th House ruler, IC lines, long-term transit patterns |

**Data captured → DB:**
```
profiles.life_goals (jsonb array, e.g. ["love", "career"])
```

**Engine impact:** Life goals are passed to `/api/house-matrix` and `/api/reading` to weight the scoring and narrative. If a user selects "Love," we emphasize Venus/7th house placements in the reading and surface love-relevant travel windows first.

---

### Screen 5: Destination
**Purpose:** Where does the user want to go (or live)?

| Field | Type | Required | UX Notes |
|---|---|---|---|
| Destination city | text (autocomplete) | ✅ | Same geocoding as birth city |
| Travel date | date picker | optional | Helper: *"Dates are flexible — we'll find the best windows around this period."* |
| Travel type | pill toggle | optional | `Trip` vs `Relocation` — changes the reading weight (short-term transits vs long-term patterns) |

**Data captured → DB:**
```
searches.destination
searches.travel_date
searches.travel_type (enum: 'trip' | 'relocation')
```

---

### Screen 6: Signup + Pay Gate 🔒
**Purpose:** Convert. The user has already seen their chart and feels invested.

| Element | Detail |
|---|---|
| Headline | *"Your full reading for [Destination] is ready."* |
| Preview | Blurred/truncated version of results (score ring visible, details gated) |
| Auth | Google OAuth button + Magic Link email input |
| Pay CTA | After auth → Stripe Checkout redirect |
| Skip option | Allow free tier (limited: Sun sign only, no house analysis, no windows) |

**Data captured → DB:**
```
users.email
users.auth_provider
purchases.stripe_session_id
purchases.product (e.g. 'single_reading')
```

**Why signup is last:** Every reference app (Duolingo, Bloom, Dawn) delays signup until after the user has experienced value. Asking for an email on Screen 1 kills conversion.

---

## Data Model Summary

```sql
-- New columns on profiles table
first_name       TEXT NOT NULL
birth_date       DATE NOT NULL
birth_time       TIME NOT NULL
birth_time_known BOOLEAN DEFAULT true
birth_city       TEXT NOT NULL
birth_lat        FLOAT8
birth_lon        FLOAT8
life_goals       JSONB DEFAULT '[]'

-- New searches table
destination      TEXT NOT NULL
travel_date      DATE
travel_type      TEXT DEFAULT 'trip'  -- 'trip' | 'relocation'
user_id          UUID REFERENCES users(id)
created_at       TIMESTAMPTZ DEFAULT now()
```

---

## What We're NOT Building (Musk Step 2)

- ❌ Social features (friend charts, compatibility) — not MVP
- ❌ Push notification opt-in during onboarding — premature
- ❌ Detailed birth time rectification — "I don't know" toggle is enough
- ❌ Multiple destinations in one flow — one at a time
- ❌ Custom avatars or profile photos — waste of time right now

---

## Success Metrics

| Metric | Target | How We Measure |
|---|---|---|
| Onboarding completion rate | > 70% (Screen 1 → Screen 6) | PostHog funnel |
| Time to Aha Moment (Screen 3) | < 30 seconds from Screen 2 submit | Timestamp delta |
| Life Goals selection rate | > 60% select at least 1 goal | DB query |
| Signup conversion (Screen 6) | > 40% of users who reach Screen 6 | Supabase auth events |

---

## Deadlines

| Milestone | Date |
|---|---|
| Screens 1-3 functional (Welcome → Birth → Aha) | March 31 |
| Screen 4 (Life Goals) wired to engine | April 1 |
| Screens 5-6 (Destination → Pay Gate) | April 3 |
| PostHog funnel tracking live | April 5 |
