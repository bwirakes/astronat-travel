import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If a 'next' param was explicitly provided (e.g. from /flow OAuth redirect), honour it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Fetch profile + subscription status in one query
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, is_subscribed')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile) {
          // ── Brand new user: no profile yet → send to onboarding flow (step 0)
          return NextResponse.redirect(`${origin}/flow`)
        }

        if (!profile.is_subscribed) {
          // ── Has a profile but never subscribed (or subscription lapsed)
          // → Drop them at the paywall step inside the flow
          return NextResponse.redirect(`${origin}/flow?step=1`)
        }

        // ── Fully subscribed returning user → go straight to the dashboard
        return NextResponse.redirect(`${origin}/home`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
