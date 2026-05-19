import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { captureServerError } from '@/lib/monitoring/sentry'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback', {
  apiVersion: '2026-03-25.dahlia',
})

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

function withCheckoutStatus(returnTo: string, status: string): string {
  const parsed = new URL(returnTo, 'https://astronat.local')
  parsed.searchParams.set('checkout', status)
  return `${parsed.pathname}${parsed.search}${parsed.hash}`
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const returnTo = validateReturnTo(searchParams.get('returnTo'))
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.redirect(new URL(withCheckoutStatus(returnTo, 'missing_session'), req.url))
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const status =
      session.payment_status === 'paid' || session.subscription
        ? 'pending_webhook'
        : session.payment_status || 'pending'

    // Stripe webhook is the authoritative writer for purchases/subscription
    // access. This browser callback only validates the session enough to route
    // the user back without performing service-role mutations.
    return NextResponse.redirect(new URL(withCheckoutStatus(returnTo, status), req.url))
  } catch (error) {
    captureServerError(error, { route: '/api/checkout/success', method: 'GET' })
    console.error('[checkout/success] Error verifying session:', error)
    return NextResponse.redirect(new URL(withCheckoutStatus(returnTo, 'verify_failed'), req.url))
  }
}
