# Prompt 09 — Transactional Email (Resend)

**Phase:** 2 | **Deadline:** May 23, 2026 | **Priority:** P1

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Email templates inherit brand typography. Use same font/color language.
2. **`docs/prd/mvp-requirements.md`** — Email decision: "Plain text with a link is fine for MVP."
3. **`app/api/webhook/route.ts`** — Created in `08-paywall.md`. This is where email send is triggered.

> **Prerequisite:** Phase 1 complete. Stripe webhook (`08-paywall.md`) already set up.

---

## What to Build

Three email sequences triggered automatically:

| Sequence | Trigger | Priority |
|---------|---------|---------|
| Post-Purchase | Stripe checkout.session.completed webhook | P0 — MVP |
| Welcome | On new user signup (Supabase auth hook) | P1 |
| Re-engagement | User completed onboarding but didn't purchase (3 days after) | P2 |

---

## Tech Setup

```bash
bun add resend
```

Add to `.env.local`:
```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=readings@astronat.co
```

---

## Email 1: Post-Purchase (MVP Priority)

Triggered in `/api/webhook/route.ts` after purchase recorded.

```ts
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

async function sendPurchaseEmail(toEmail: string, userName: string, destination: string, readingUrl: string) {
  await resend.emails.send({
    from: `Astronat <${process.env.RESEND_FROM_EMAIL}>`,
    to: toEmail,
    subject: `Your ${destination} reading is ready ✨`,
    text: `
Hi ${userName},

Your full Astronat reading for ${destination} is ready.

View your reading:
${readingUrl}

—
Astronat
Questions? Reply to this email.
    `.trim(),
  })
}
```

Call this in the webhook after recording the purchase:
```ts
await sendPurchaseEmail(
  session.customer_email!,
  profile.first_name,
  search.destination,
  `${process.env.NEXT_PUBLIC_APP_URL}/reading/${destinationId}`
)
```

---

## Email 2: Welcome Email

Triggered via Supabase Auth webhook (set up in Supabase Dashboard → Auth → Hooks):

```ts
// app/api/auth-webhook/route.ts
export async function POST(req: Request) {
  const { event, user } = await req.json()

  if (event === 'SIGNED_UP') {
    await resend.emails.send({
      from: `Astronat <${process.env.RESEND_FROM_EMAIL}>`,
      to: user.email,
      subject: 'Welcome to Astronat ✨',
      text: `
Hi there,

Welcome to Astronat — your personal astrocartography guide.

Start your first reading anytime:
${process.env.NEXT_PUBLIC_APP_URL}/home

—
Astronat
      `.trim(),
    })
  }

  return Response.json({ ok: true })
}
```

---

## Email 3: Re-engagement (P2)

A scheduled job (use Vercel Cron or Supabase Edge Function) that runs daily:

```ts
// Find users who completed onboarding 3 days ago but have no purchases
const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
const { data: candidates } = await supabase
  .from('profiles')
  .select('id, first_name, users!inner(email)')
  .lt('created_at', threeDaysAgo)
  .not('id', 'in', supabase.from('purchases').select('user_id'))

for (const user of candidates ?? []) {
  await resend.emails.send({
    from: `Astronat <${process.env.RESEND_FROM_EMAIL}>`,
    to: user.users.email,
    subject: `${user.first_name}, your reading is waiting`,
    text: `
Hi ${user.first_name},

You started your Astronat journey but haven't unlocked your full reading yet.

Your chart is ready — pick a destination and see where the stars take you.

Start here:
${process.env.NEXT_PUBLIC_APP_URL}/flow

—
Astronat
    `.trim(),
  })
}
```

---

## Phase 2+ Upgrade Path

After MVP ships, upgrade to React Email templates:

```bash
bun add @react-email/components react-email
```

This allows HTML emails with brand fonts and Astro-Brand styling. Keep the same send function signatures — just swap `text:` for `react:`.

---

## Verification Checklist

- [ ] `RESEND_API_KEY` and `RESEND_FROM_EMAIL` set in `.env.local`
- [ ] Post-purchase email fires from Stripe webhook
- [ ] Welcome email fires on new signup
- [ ] Re-engagement job scheduled (Vercel Cron or Supabase Edge Function)
- [ ] All emails have plain-text fallbacks
- [ ] `From` address uses branded domain (not Gmail/generic)
