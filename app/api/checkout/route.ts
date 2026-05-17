import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { capturePostHogEvent } from '@/lib/posthog-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback', {
  apiVersion: '2026-03-25.dahlia', 
})

type CheckoutOffer = 'single' | 'monthly' | 'lifetime'

const MONTHLY_PRICE_FALLBACK = 'price_1TGqfnDCYzkth9F1V1O7ov0d'

const CHECKOUT_OFFERS: Record<CheckoutOffer, { mode: 'payment' | 'subscription'; priceId?: string }> = {
  single: {
    mode: 'payment',
    priceId: process.env.STRIPE_SINGLE_PRICE_ID,
  },
  monthly: {
    mode: 'subscription',
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || MONTHLY_PRICE_FALLBACK,
  },
  lifetime: {
    mode: 'payment',
    priceId: process.env.STRIPE_LIFETIME_PRICE_ID,
  },
}

function parseCheckoutOffer(value: unknown): CheckoutOffer | null {
  if (value === undefined) return 'monthly'
  return value === 'single' || value === 'lifetime' || value === 'monthly' ? value : null
}

function validateReturnTo(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null

  try {
    const parsed = new URL(value, 'https://astronat.local')
    if (parsed.origin !== 'https://astronat.local') return null
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Attempt to read stripe_customer_id from profiles - silently ignore DB errors
    // (e.g. column not yet migrated in production) and fall through to create a new customer
    let stripeCustomerId: string | null = null
    let firstName: string | null = null
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id, first_name')
        .eq('id', user.id)
        .maybeSingle()
      if (profileError) {
        console.warn('[checkout] Profile query error (non-fatal):', profileError.message)
      } else {
        stripeCustomerId = profile?.stripe_customer_id ?? null
        firstName = profile?.first_name ?? null
      }
    } catch (e: unknown) {
      console.warn('[checkout] Profile fetch threw (non-fatal):', getErrorMessage(e))
    }

    // If they don't have one, create a Stripe customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: firstName || '',
        metadata: { supabase_user_id: user.id },
      })
      stripeCustomerId = customer.id

      // Best-effort: save back to profile (ignore failure if column missing)
      try {
        const adminClient = createAdminClient()
        await adminClient
          .from('profiles')
          .upsert({ id: user.id, stripe_customer_id: stripeCustomerId })
      } catch (e: unknown) {
        console.warn('[checkout] Could not persist stripe_customer_id (non-fatal):', getErrorMessage(e))
      }
    }

    // Ensure we absolutely have a valid absolute baseUrl for Stripe
    let baseUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''
    
    // Fall back to VERCEL_URL if origin and NEXT_PUBLIC_APP_URL are somehow missing or literal 'undefined'
    if (!baseUrl || baseUrl === 'undefined') {
      baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://astronat.vercel.app'
    }

    // Strip trailing slash
    baseUrl = baseUrl.replace(/\/$/, '')

    // Forcibly inject https:// if it's completely missing (can happen with raw VERCEL_URL strings)
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`
    }

    console.log('[checkout] Derived baseUrl:', baseUrl, '| APP_URL:', process.env.NEXT_PUBLIC_APP_URL, '| VERCEL_URL:', process.env.VERCEL_URL, '| origin:', req.headers.get('origin'))

    // Optional body: { offer?: 'single' | 'monthly' | 'lifetime', returnTo?: string }
    let returnTo: string | null = null
    let offer: CheckoutOffer = 'monthly'
    try {
      const body = await req.clone().json().catch(() => ({}))
      const parsedOffer = parseCheckoutOffer(body?.offer)
      if (!parsedOffer) {
        return NextResponse.json({ error: 'Invalid checkout offer' }, { status: 400 })
      }
      offer = parsedOffer
      if (body?.returnTo !== undefined) {
        returnTo = validateReturnTo(body.returnTo)
        if (!returnTo) {
          return NextResponse.json({ error: 'Invalid returnTo path' }, { status: 400 })
        }
      }
    } catch {}

    const checkoutOffer = CHECKOUT_OFFERS[offer]
    if (!checkoutOffer.priceId) {
      console.error(`[checkout] Missing Stripe price ID for ${offer} offer`)
      return NextResponse.json({ error: 'Checkout is not configured for this offer.' }, { status: 500 })
    }

    const successUrl = returnTo
      ? `${baseUrl}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}&returnTo=${encodeURIComponent(returnTo)}`
      : `${baseUrl}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = returnTo ? `${baseUrl}${returnTo}` : `${baseUrl}/dashboard`

    // Create a Checkout Session for the selected offer.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      line_items: [
        {
          price: checkoutOffer.priceId,
          quantity: 1,
        },
      ],
      mode: checkoutOffer.mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      metadata: {
        offer,
        price_id: checkoutOffer.priceId,
        supabase_user_id: user.id,
      },
      subscription_data: checkoutOffer.mode === 'subscription'
        ? {
            metadata: {
              offer,
              price_id: checkoutOffer.priceId,
              supabase_user_id: user.id,
            },
          }
        : undefined,
    })

    await capturePostHogEvent({
      distinctId: user.id,
      event: 'checkout_session_started',
      properties: {
        stripe_session_id: session.id,
        stripe_customer_id: stripeCustomerId,
        offer,
        return_to: returnTo,
      },
    })

    return NextResponse.json({ url: session.url })

  } catch (error: unknown) {
    const message = getErrorMessage(error)
    console.error('[checkout] Fatal error:', message, error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
