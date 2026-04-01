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

    // Attempt to read stripe_customer_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, first_name')
      .eq('id', user.id)
      .single()

    let stripeCustomerId = profile?.stripe_customer_id

    // If they don't have one, create it on Stripe and save to Supabase
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.first_name || '',
        metadata: {
          supabase_user_id: user.id,
        },
      })
      
      stripeCustomerId = customer.id

      // Use admin client to bypass any RLS quirks when updating secure fields, though standard client works here usually
      const adminClient = createAdminClient();
      await adminClient
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id)
    }

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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/flow?step=2`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/flow?step=1`,
      client_reference_id: user.id, // Good backup metric
    })

    return NextResponse.json({ url: session.url })

  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
