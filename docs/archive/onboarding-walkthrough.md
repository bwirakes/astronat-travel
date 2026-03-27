# Astronat MVP: Onboarding Walkthrough

The Astronat onboarding flow is a high-conversion, 6-screen progressive experience designed with a 90s Y2K editorial aesthetic. The flow captures critical user data, provides an immediate "Aha Moment", and builds value before presenting a payment gate.

> [!NOTE]
> The interactive flow is live at `http://localhost:3000/mockup-onboarding`.
> Due to browser tool limitations (EOF errors), visual screenshots could not be generated at this time.

---

## Screen 0: Welcome (The Hook)
- **Goal:** Establish brand authority and value proposition.
- **Visuals:** Split layout. Left (Desktop) / Top (Mobile) features a grainy editorial image (`pastel_suits.png`) with a glassmorphic overlay for a premium feel.
- **Messaging:** "WHERE IN THE WORLD SHOULD YOU BE?" – using the `BETTER DAYS` display font.
- **Brand Elements:** Includes the `logo-stacked.svg` and `saturn-monogram.svg`.
- **Primary CTA:** "Start Your Edit" – Styled with a heavy 90s shadow.

## Screen 1: Birth Data (The Capture)
- **Goal:** Collect exact user data for calculations.
- **Fields:** Name, Date of Birth, Time (with "approx" toggle), and City.
- **Interactive Element:** A real-time Sun Sign detector (e.g., "Scorpio Sun Detected ✦") appears with its corresponding glyph once a date is entered.
- **Design:** Stark, high-contrast inputs with floating labels for clear hierarchy.

## Screen 2: Aha Moment (The Payoff)
- **Goal:** Prove value early by showing natal insights.
- **Features:** A large floating astrological glyph (Sun Sign) with a radial glow.
- **Messaging:** Personalization based on the user's name: "ALEX IS THE SCORPIO".
- **Insights:** Three horizontal "cards" with editorial-style analysis for Sun, Moon, and Rising signs.
- **Logic:** Uses the core planetary engine (`app/lib/scoring.ts`) to determine signs and traits.

## Screen 3: Life Goals (The Personalization)
- **Goal:** Align the user's journey with their priorities.
- **Options:** 6 interactive goal tiles (Love, Career, Community, Friendship, Healing, Adventure).
- **Selection:** Multi-select (up to 3). Selected tiles use the Y2K Blue and Sage accents.
- **Alignment:** Each goal maps to specific planetary lines (e.g., Love -> Venus lines, Career -> Jupiter/MC).

## Screen 4: Destination (The Context)
- **Goal:** Define the travel or relocation target.
- **Features:** Toggle between "✈️ Short Trip" and "🏠 Relocation".
- **Fields:** Destination city and an optional target date.
- **Micro-copy:** "Dates are flexible — we'll find the best windows around this period."

## Screen 5: Pay Gate (The Conversion)
- **Goal:** Convert the user to a paid report.
- **Mobile Responsive:** Stacks into a scrolling layout for easier mobile conversion.
- **Teaser Content:** A blurred preview of the "Trip Score", "Venus Line proximity", and "Jupiter MC status" to create a "locked value" curiosity gap.
- **CTAs:** 
  - **Auth:** Google OAuth or Magic Link sign-up.
  - **Payment:** A $9 Stripe checkout for the "Full Editorial Reading".
- **Key value points:** House analysis, 12-month transit windows, and AI-powered narrative report.

---

### Technical Implementation Details
- **Tech Stack:** Next.js (App Router), `framer-motion` for transitions, Tailwind CSS for layout, Custom CSS variables for the Astro-Brand design tokens.
- **Responsiveness:** All screens use `clamp()` for fluid typography and a responsive layout that stacks on screens smaller than 768px.
- **Brand Tokens:** 
  - Background: `var(--color-black)`
  - Text: `var(--color-eggshell)`
  - Accent: `var(--color-y2k-blue)`
  - Shapes: Asymmetric `clip-path` (e.g., `var(--cut-sm)`).
