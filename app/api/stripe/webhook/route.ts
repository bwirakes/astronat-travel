import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { capturePostHogEvent } from '@/lib/posthog-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback', {
  apiVersion: '2026-03-25.dahlia',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

type CheckoutOffer = 'single' | 'monthly' | 'lifetime'

type SubscriptionPeriodSnapshot = Stripe.Subscription & {
  current_period_end?: number | null
  current_period_start?: number | null
  items?: {
    data?: Array<{
      current_period_end?: number | null
      current_period_start?: number | null
      price?: { id?: string | null } | null
    }>
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function getCheckoutOffer(session: Stripe.Checkout.Session): CheckoutOffer {
  const offer = session.metadata?.offer
  if (offer === 'single' || offer === 'monthly' || offer === 'lifetime') return offer
  return session.mode === 'subscription' ? 'monthly' : 'single'
}

function productForOffer(offer: CheckoutOffer): string {
  if (offer === 'single') return 'single_reading'
  if (offer === 'lifetime') return 'lifetime_access'
  return 'subscription_pro'
}

function getStripeCustomerId(session: Stripe.Checkout.Session): string | null {
  return typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id ?? null
}

async function recordCheckoutPurchase(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  session: Stripe.Checkout.Session,
  offer: CheckoutOffer,
) {
  const { error } = await supabase
    .from('purchases')
    .upsert({
      user_id: userId,
      stripe_session_id: session.id,
      product: productForOffer(offer),
    }, { onConflict: 'stripe_session_id' })

  if (error) {
    console.error('[webhook] Error recording purchase:', error.message)
  }
}

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
  // We read it from the first item if available to stay forward-compatible.
  const sub = subscription as SubscriptionPeriodSnapshot
  const periodEnd: number | null =
    sub.current_period_end ??
    sub.items?.data?.[0]?.current_period_end ??
    null

  const endsAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null
  const startsAt = sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null

  // 1. Sync Fast Boolean to Profiles (for RLS Performance)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      is_subscribed: isActive,
      subscription_status: status,
      subscription_id: subscription.id,
      subscription_ends_at: endsAt,
    })
    .eq('id', resolvedUserId)

  if (profileError) {
    console.error('[webhook] Failed to update profile:', profileError.message)
  }

  // 2. Sync Full Record to Subscriptions Table (Source of Truth)
  // Use stripe_subscription_id for upsert logic if the table schema supports it, 
  // currently we treat stripe_subscription_id as UNIQUE in our migration.
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: resolvedUserId,
      stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
      stripe_subscription_id: subscription.id,
      status: status,
      current_period_start: startsAt,
      current_period_end: endsAt,
      plan_id: sub.items?.data?.[0]?.price?.id ?? null,
    }, { onConflict: 'stripe_subscription_id' })

  if (subError) {
    console.error('[webhook] Failed to update subscriptions table:', subError.message)
  } else {
    console.log(`[webhook] Fully synced ${subscription.id} for user ${resolvedUserId}`)
  }

  // Invalidate cached profile + access for this user; the next /dashboard
  // or gated request will refetch from Supabase.
  revalidateTag(`profile-${resolvedUserId}`, 'max')
  revalidateTag(`access-${resolvedUserId}`, 'max')

  return resolvedUserId
}

async function grantLifetimeAccess(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  session: Stripe.Checkout.Session,
) {
  const now = new Date().toISOString()
  const lifetimeId = `lifetime:${session.id}`

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      is_subscribed: true,
      subscription_status: 'active',
      subscription_id: lifetimeId,
      subscription_ends_at: null,
    })
    .eq('id', userId)

  if (profileError) {
    console.error('[webhook] Failed to grant lifetime profile access:', profileError.message)
  }

  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: getStripeCustomerId(session),
      stripe_subscription_id: lifetimeId,
      status: 'active',
      current_period_start: now,
      current_period_end: null,
      plan_id: session.metadata?.price_id ?? null,
    }, { onConflict: 'stripe_subscription_id' })

  if (subError) {
    console.error('[webhook] Failed to grant lifetime subscription access:', subError.message)
  }

  revalidateTag(`profile-${userId}`, 'max')
  revalidateTag(`access-${userId}`, 'max')
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
  } catch (err: unknown) {
    console.error('[webhook] sendWelcomeEmail threw:', getErrorMessage(err))
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: unknown) {
    const message = getErrorMessage(err)
    console.error(`Webhook signature verification failed: ${message}`)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {

    // ── Payment success: subscription becomes active ──────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id
      const offer = getCheckoutOffer(session)

      if (!userId) {
        console.warn('[webhook] No client_reference_id found in session', session.id)
        break
      }

      await recordCheckoutPurchase(supabase, userId, session, offer)

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
          revalidateTag(`profile-${userId}`, 'max')
          revalidateTag(`access-${userId}`, 'max')
        }
      } else if (offer === 'lifetime' && session.payment_status === 'paid') {
        await grantLifetimeAccess(supabase, userId, session)
      } else if (offer === 'single' && session.payment_status === 'paid') {
        revalidateTag(`access-${userId}`, 'max')
      }

      // Send welcome email only for unlimited access offers.
      if (offer !== 'single') {
        await sendWelcomeEmail(supabase, userId)
      }

      await capturePostHogEvent({
        distinctId: userId,
        event: offer === 'single' ? 'single_reading_purchased' : 'subscription_activated',
        properties: {
          stripe_session_id: session.id,
          offer,
          product: productForOffer(offer),
        },
      })

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
      const resolvedUserId = await syncSubscriptionToProfile(supabase, subscription)
      if (resolvedUserId) {
        await capturePostHogEvent({
          distinctId: resolvedUserId,
          event: 'subscription_cancelled',
          properties: {
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
          },
        })
      }
      break
    }

    default:
      console.log(`[webhook] Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
