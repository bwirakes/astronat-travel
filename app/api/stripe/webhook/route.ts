import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback', {
  apiVersion: '2026-03-25.dahlia',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

// ─── Helper: update profile subscription fields ───────────────────────────────
async function syncSubscriptionToProfile(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
  userId?: string | null,
) {
  // Resolve the user_id from supabase via stripe_customer_id if not provided
  let resolvedUserId = userId

  if (!resolvedUserId) {
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id

    if (!customerId) {
      console.warn('[webhook] Could not resolve customer ID from subscription')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()

    resolvedUserId = profile?.id ?? null
  }

  if (!resolvedUserId) {
    console.warn('[webhook] Could not resolve user for subscription', subscription.id)
    return
  }

  const status = subscription.status // 'active' | 'trialing' | 'past_due' | 'canceled' | etc.
  const isActive = status === 'active' || status === 'trialing'

  // In Stripe API >= 2025, current_period_end is on each subscription item.
  // We read it from the first item if available; cast to any to stay forward-compat.
  const sub = subscription as any
  const periodEnd: number | null =
    sub.current_period_end ??
    sub.items?.data?.[0]?.current_period_end ??
    null

  const endsAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null


  const { error } = await supabase
    .from('profiles')
    .update({
      is_subscribed: isActive,
      subscription_status: status,
      subscription_id: subscription.id,
      subscription_ends_at: endsAt,
    })
    .eq('id', resolvedUserId)

  if (error) {
    console.error('[webhook] Failed to update profile subscription fields:', error.message)
  } else {
    console.log(`[webhook] Synced subscription ${subscription.id} → user ${resolvedUserId} | status=${status}`)
  }

  return resolvedUserId
}

// ─── Helper: fire welcome email via internal route ────────────────────────────
async function sendWelcomeEmail(supabase: ReturnType<typeof createAdminClient>, userId: string) {
  try {
    // Fetch user auth data (email) and first name
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    const email = authUser?.user?.email
    if (!email) {
      console.warn('[webhook] No email found for user', userId)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', userId)
      .maybeSingle()

    const firstName = profile?.first_name || ''

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({ email, firstName }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[webhook] Welcome email route responded with error:', text)
    } else {
      console.log('[webhook] Welcome email dispatched for', email)
    }
  } catch (err: any) {
    console.error('[webhook] sendWelcomeEmail threw:', err.message)
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {

    // ── Payment success: subscription becomes active ──────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id

      if (!userId) {
        console.warn('[webhook] No client_reference_id found in session', session.id)
        break
      }

      // Record the purchase
      const { error: purchaseError } = await supabase.from('purchases').insert({
        user_id: userId,
        stripe_session_id: session.id,
        product: 'subscription_pro',
      })
      if (purchaseError) {
        console.error('[webhook] Error inserting purchase:', purchaseError.message)
      }

      // If there's a subscription on the session, sync it immediately
      if (session.subscription) {
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          await syncSubscriptionToProfile(supabase, sub, userId)
        } else {
          // Mark subscribed even without full sub object yet (payment completed)
          await supabase
            .from('profiles')
            .update({ is_subscribed: true, subscription_status: 'active' })
            .eq('id', userId)
        }
      }

      // Send welcome email — only after subscription is confirmed
      await sendWelcomeEmail(supabase, userId)

      console.log(`[webhook] Checkout completed for user ${userId}`)
      break
    }

    // ── Subscription activated / renewed ─────────────────────────────────────
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await syncSubscriptionToProfile(supabase, subscription)
      break
    }

    // ── Subscription cancelled / expired ─────────────────────────────────────
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await syncSubscriptionToProfile(supabase, subscription)
      break
    }

    default:
      console.log(`[webhook] Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
