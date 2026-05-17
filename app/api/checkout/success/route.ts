import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback', {
  apiVersion: '2026-03-25.dahlia',
})

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

function validateReturnTo(value: string | null): string {
  if (!value) return '/dashboard'
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/dashboard'

  try {
    const parsed = new URL(value, 'https://astronat.local')
    if (parsed.origin !== 'https://astronat.local') return '/dashboard'
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return '/dashboard'
  }
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

async function recordPurchase(
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
    console.error('[checkout/success] Failed to record purchase:', error.message)
  }
}

async function syncSubscriptionToAccess(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
  userId: string,
) {
  const status = subscription.status
  const isActive = status === 'active' || status === 'trialing'
  const sub = subscription as SubscriptionPeriodSnapshot
  const periodEnd: number | null =
    sub.current_period_end ??
    sub.items?.data?.[0]?.current_period_end ??
    null
  const periodStart: number | null =
    sub.current_period_start ??
    sub.items?.data?.[0]?.current_period_start ??
    null

  const startsAt = periodStart ? new Date(periodStart * 1000).toISOString() : null
  const endsAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null
  const stripeCustomerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id ?? null

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      is_subscribed: isActive,
      subscription_status: status,
      subscription_id: subscription.id,
      subscription_ends_at: endsAt,
    })
    .eq('id', userId)

  if (profileError) {
    console.error('[checkout/success] Failed to update profile:', profileError.message)
  }

  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscription.id,
      status,
      current_period_start: startsAt,
      current_period_end: endsAt,
      plan_id: sub.items?.data?.[0]?.price?.id ?? null,
    }, { onConflict: 'stripe_subscription_id' })

  if (subError) {
    console.error('[checkout/success] Failed to update subscriptions table:', subError.message)
  }
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
    console.error('[checkout/success] Failed to grant lifetime profile access:', profileError.message)
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
    console.error('[checkout/success] Failed to grant lifetime subscription access:', subError.message)
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const returnTo = validateReturnTo(searchParams.get('returnTo'))

  try {
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.redirect(new URL(returnTo, req.url))
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const offer = getCheckoutOffer(session)

    // Check if the payment was actually successful. Subscription trials may not
    // be marked paid yet, but a subscription ID is enough to sync Stripe status.
    if ((session.payment_status === 'paid' || session.subscription) && session.client_reference_id) {
      const supabase = createAdminClient()
      const userId = session.client_reference_id
      await recordPurchase(supabase, userId, session, offer)

      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id

      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        await syncSubscriptionToAccess(supabase, sub, userId)
      } else if (offer === 'lifetime') {
        await grantLifetimeAccess(supabase, userId, session)
      }

      revalidateTag(`profile-${userId}`, 'max')
      revalidateTag(`access-${userId}`, 'max')
    }

    // Return to the page they came from (dashboard by default)
    return NextResponse.redirect(new URL(returnTo, req.url))
  } catch (error) {
    console.error('[checkout/success] Error verifying session:', error)
    return NextResponse.redirect(new URL(returnTo, req.url))
  }
}
