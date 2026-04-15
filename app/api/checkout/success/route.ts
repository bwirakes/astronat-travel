import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback', {
  apiVersion: '2026-03-25.dahlia',
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.redirect(new URL('/flow?step=1', req.url))
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    // Check if the payment was actually successful
    if (session.payment_status === 'paid' && session.client_reference_id) {
      const supabase = createAdminClient()
      const userId = session.client_reference_id
      
      // Force update to is_subscribed immediately to bypass Vercel webhook latency/miss
      let subscriptionId = typeof session.subscription === 'string' 
        ? session.subscription 
        : session.subscription?.id

      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        
        const status = sub.status
        const isActive = status === 'active' || status === 'trialing'
        const subData = sub as any
        const periodEnd: number | null = subData.current_period_end ?? subData.items?.data?.[0]?.current_period_end ?? null
        const endsAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null
        
        await supabase
          .from('profiles')
          .update({
            is_subscribed: isActive,
            subscription_status: status,
            subscription_id: sub.id,
            subscription_ends_at: endsAt
          })
          .eq('id', userId)
      } else {
        // Best effort fallback
        await supabase
          .from('profiles')
          .update({ is_subscribed: true, subscription_status: 'active' })
          .eq('id', userId)
      }
    }

    // Now safely proceed to step 2 with state guaranteed synced
    return NextResponse.redirect(new URL('/flow?step=2', req.url))
  } catch (error) {
    console.error('[checkout/success] Error verifying session:', error)
    // If something horribly fails, gracefully drop them onto step 1
    return NextResponse.redirect(new URL('/flow?step=1', req.url))
  }
}
