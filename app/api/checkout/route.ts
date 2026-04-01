import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback', {
  apiVersion: '2026-03-25.dahlia', 
})

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
    } catch (e: any) {
      console.warn('[checkout] Profile fetch threw (non-fatal):', e.message)
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
      } catch (e: any) {
        console.warn('[checkout] Could not persist stripe_customer_id (non-fatal):', e.message)
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

    // Create a Checkout Session for Subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      line_items: [
        {
          price: 'price_1TGqfnDCYzkth9F1V1O7ov0d', // $19.99/mo Monthly Subscription
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/flow?step=2`,
      cancel_url: `${baseUrl}/flow?step=1`,
      client_reference_id: user.id,
    })

    return NextResponse.json({ url: session.url })

  } catch (error: any) {
    console.error('[checkout] Fatal error:', error.message, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
