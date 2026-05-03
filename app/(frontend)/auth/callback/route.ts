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
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, birth_date')
          .eq('id', user.id)
          .maybeSingle()

        // Onboarding gate: anyone without birth data goes through /flow,
        // regardless of any `next` param. Always clamp to step=1 so users
        // can't skip data entry via a crafted URL.
        if (!profile?.birth_date) {
          return NextResponse.redirect(`${origin}/flow?step=1`)
        }

        // Onboarded users honour `next` if provided, else land on /dashboard.
        const dest = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
        return NextResponse.redirect(`${origin}${dest}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
