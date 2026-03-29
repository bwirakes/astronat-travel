# Prompt 11 — Launch Prep (SEO, Analytics, Policy)

**Phase:** 2 | **Deadline:** May 30, 2026 | **Priority:** P1

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — OG images should match brand aesthetic.
2. **`app/globals.css`** — Brand colors for OG image backgrounds.
3. **`docs/prd/mvp-requirements.md`** — Success metrics section.

---

## What to Build

Everything needed to go live on June 7.

---

## 1. SEO Meta Tags

Add to `app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: 'Astronat — Your Astrocartography Reading',
  description: 'Discover where in the world your stars align. Personalized astrocartography readings based on your birth chart.',
  keywords: ['astrocartography', 'astrology', 'natal chart', 'travel astrology'],
  openGraph: {
    title: 'Astronat — Where should you be?',
    description: 'Personalized astrocartography. Discover your ideal destinations.',
    images: ['/og-image.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astronat — Where should you be?',
    images: ['/og-image.jpg'],
  },
}
```

Generate OG image (`/public/og-image.jpg`): Editorial photo `/astronat-hero.jpg` with `var(--color-charcoal)` overlay, white BETTER DAYS headline "Where should you be?", Saturn logo.

---

## 2. PostHog Analytics

```bash
bun add posthog-js posthog-node
```

Track the key funnel events:

```ts
// Onboarding events
posthog.capture('onboarding_step_completed', { step: 1, screen: 'welcome' })
posthog.capture('onboarding_step_completed', { step: 3, screen: 'aha_moment' })
posthog.capture('onboarding_completed', { life_goals: ['love', 'career'] })

// Conversion events
posthog.capture('checkout_initiated', { destination, macro_score })
posthog.capture('purchase_completed', { product: 'single_reading', amount: 9 })
```

Key funnels to configure in PostHog:
- Onboarding completion: Screen 1 → Screen 6 (target: >70%)
- Purchase conversion: Results view → Checkout → Purchase (target: >40%)

---

## 3. Legal Policies

Create the following pages:

**`app/privacy/page.tsx`** — Privacy Policy covering:
- What data we collect (birth data, destination searches)
- How it's used (chart calculation, personalization only)
- No selling of personal data
- User data deletion request

**`app/terms/page.tsx`** — Terms of Service covering:
- Astrological readings are for entertainment and personal reflection purposes
- "Creative authority" disclaimer — not medical, financial, or legal advice
- Refund policy (no refunds on digital readings, exceptions at discretion)
- Acceptable use

**`app/cookies/page.tsx`** — Cookie notice (simple: analytics only).

Add links to footer on all pages.

---

## 4. Performance Audit

Run Lighthouse on:
- Landing page
- App Home
- Reading results page

Target: **90+ Performance score** on desktop, **75+ on mobile**.

Common fixes:
- Add `loading="lazy"` to below-fold images
- Use `next/image` for all images (not raw `<img>`)
- Preload `/logo-stacked.svg` in `<head>`

---

## Verification Checklist

- [ ] Meta tags on all pages (title, description, OG, Twitter)
- [ ] `/og-image.jpg` generated and matches brand aesthetic
- [ ] PostHog installed, key funnel events tracked
- [ ] Privacy Policy page at `/privacy`
- [ ] Terms of Service at `/terms` with astrological disclaimer
- [ ] Cookie notice at `/cookies`
- [ ] Footer links to Privacy, Terms, Cookie policies on all pages
- [ ] Lighthouse score ≥ 90 desktop, ≥ 75 mobile
- [ ] All images use `next/image`
