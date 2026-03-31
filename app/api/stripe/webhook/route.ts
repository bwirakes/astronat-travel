import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback', {
  apiVersion: '2026-03-25.dahlia', // Latest or default according to TS
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

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

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session

      // client_reference_id should be the Supabase user ID.
      const userId = session.client_reference_id

      if (!userId) {
        console.warn('No client_reference_id found in session', session.id)
        break
      }

      // Record the purchase locally to unlock features
      const { error } = await supabase.from('purchases').insert({
        user_id: userId,
        stripe_session_id: session.id,
        product: 'single_reading'
      })

      if (error) {
        console.error('Error inserting purchase:', error.message)
      } else {
        console.log(`Successfully recorded purchase for user ${userId}`)
      }
      break
    
    // Add other event types here if you need to handle subscriptions going bad
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true }, { status: 200 })
}
