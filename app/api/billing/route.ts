import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

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

    let stripeCustomerId: string | null = null
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (profileError) {
        console.warn('[billing] Profile lookup error:', profileError.message)
      } else {
        stripeCustomerId = profile?.stripe_customer_id ?? null
      }
    } catch (e: any) {
      console.warn('[billing] DB Query threw:', e.message)
    }

    if (!stripeCustomerId) {
       return NextResponse.json({ error: 'No active Stripe customer linked to this profile. Please initiate a checkout first.' }, { status: 400 })
    }

    // Create a Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile`,
    })

    return NextResponse.json({ url: session.url })

  } catch (error: any) {
    console.error('Error creating Stripe portal session:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
