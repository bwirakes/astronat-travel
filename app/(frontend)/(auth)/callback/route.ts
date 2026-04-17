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
        // Check whether the user has completed onboarding (has birth data saved)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, birth_date')
          .eq('id', user.id)
          .maybeSingle()

        // Profile exists with birth data → straight to the app; gating happens in-route.
        if (profile?.birth_date) {
          return NextResponse.redirect(`${origin}/dashboard`)
        }

        // Otherwise send them through onboarding to capture birth details.
        return NextResponse.redirect(`${origin}/flow`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
