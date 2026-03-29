# Prompt 08 — Paywall (Stripe Checkout)

**Phase:** 2 | **Deadline:** May 20, 2026 | **Priority:** P0

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Design system. The paywall gate UI must follow brand rules.
2. **`app/globals.css`** — CSS tokens. Never hardcode values.
3. **`docs/prd/mvp-requirements.md`** — Payments decision: "Use Stripe's hosted Checkout — zero custom UI."
4. **`app/home/page.tsx`** and **`app/flow/page.tsx`** — Where paywall gate is injected.

> **Prerequisite:** Phase 1 complete. Supabase auth + `purchases` table (from `07-database.md`) already set up.

---

## What to Build

Gate full reading results behind a one-time Stripe payment. Phase 2 wraps this around the existing Phase 1 reading UI.

**What NOT to build:**
- ❌ Custom payment form — use Stripe's hosted Checkout page only
- ❌ Subscription billing — single purchase only
- ❌ Admin dashboard — use Stripe Dashboard directly

---

## Tech Setup

```bash
bun add stripe
```

Add to `.env.local`:
```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## Backend

### `/api/checkout/route.ts`

```ts
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { destinationId } = await req.json()

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: user.email,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'Astronat Full Reading', description: 'Complete astrocartography analysis for one destination.' },
        unit_amount: 900, // $9.00
      },
      quantity: 1,
    }],
    success_url: `${req.headers.get('origin')}/reading/${destinationId}?success=true`,
    cancel_url: `${req.headers.get('origin')}/reading/${destinationId}?cancelled=true`,
    metadata: { userId: user.id, destinationId },
  })

  return NextResponse.json({ url: session.url })
}
```

### `/api/webhook/route.ts`

```ts
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Use service role key for webhook writes (bypass RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, destinationId } = session.metadata!

    // Record purchase
    await supabase.from('purchases').insert({
      user_id: userId,
      stripe_session_id: session.id,
      product: 'single_reading',
    })

    // Trigger email (Phase 2 — see 09-email.md)
    // await sendPurchaseEmail(session.customer_email!, destinationId)
  }

  return NextResponse.json({ received: true })
}

export const config = { api: { bodyParser: false } }
```

---

## UI — Gated Results

In the reading results page, check if user has a purchase. If not, show the paywall gate:

```tsx
const hasPurchased = await checkPurchase(userId, destinationId)

if (!hasPurchased) {
  return <PaywallGate destinationId={destinationId} score={macroScore} verdict={verdict} />
}
```

### `PaywallGate` component design

- Show: Score ring (blurred preview), verdict label, destination name
- Gate: Overlay with CTA
- Design: `var(--color-charcoal)` bg, Y2K Blue CTA, asymmetric shape

```tsx
<div style={{ position: 'relative', overflow: 'hidden' }}>
  {/* Blurred preview */}
  <div style={{ filter: 'blur(8px)', pointerEvents: 'none', userSelect: 'none' }}>
    <ScoreRing score={score} size={120} />
    <VerdictLabel score={score} />
    {/* Dummy cards */}
  </div>

  {/* Gate overlay */}
  <div style={{
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to top, var(--color-charcoal) 40%, transparent)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'flex-end',
    padding: 'var(--space-xl)',
    textAlign: 'center',
  }}>
    <h2 style={{ fontFamily: 'var(--font-primary)' }}>Your full reading is ready.</h2>
    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
      Unlock complete analysis for {destination} — $9
    </p>
    <button className="btn btn-primary"
      style={{ borderRadius: 'var(--shape-asymmetric-md)', fontSize: '1rem' }}
      onClick={redirectToCheckout}
    >
      Unlock Reading →
    </button>
    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-sm)' }}>
      Or continue with free tier (Sun sign only)
    </p>
  </div>
</div>
```

---

## Design Checklist

- [ ] Hosted Stripe Checkout — no custom payment form
- [ ] Blurred preview uses `filter: blur(8px)` with overlay gradient
- [ ] CTA uses `var(--shape-asymmetric-md)` + `var(--color-y2k-blue)`
- [ ] Score ring visible through blur (hooks curiosity)
- [ ] Free tier option available (Sun sign only)
- [ ] Webhook records to `purchases` table via service role key
