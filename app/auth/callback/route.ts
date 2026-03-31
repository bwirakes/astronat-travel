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
      // If a 'next' param was explicitly provided, respect it above all else
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Check if user has a profile (returning vs new user)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
        // If no profile, they are a new user who just finished Onboarding Screen 6.
        // Route them to /home?finalize_onboarding=true so the client can read localStorage
        // and save their collected data to the database before showing the dashboard.
        const destination = profile ? '/home' : '/home?finalize_onboarding=true'
        return NextResponse.redirect(`${origin}${destination}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
