import { createClient } from '@/lib/supabase/server'
import { capturePostHogEvent, identifyPostHogUser } from '@/lib/posthog-server'
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

        await identifyPostHogUser({
          distinctId: user.id,
          properties: {
            email: user.email,
            auth_provider: user.app_metadata?.provider,
            onboarded: Boolean(profile?.birth_date),
            created_at: user.created_at,
          },
        })

        // Onboarding gate: anyone without birth data goes through /flow,
        // regardless of any `next` param. Always clamp to step=1 so users
        // can't skip data entry via a crafted URL.
        if (!profile?.birth_date) {
          await capturePostHogEvent({
            distinctId: user.id,
            event: 'onboarding_gate_entered',
            properties: {
              source: 'auth_callback',
              next,
            },
          })
          return NextResponse.redirect(`${origin}/flow?step=1`)
        }

        // Backfill the auth-user onboarded flag for users created before the
        // proxy started reading it, so subsequent navigations skip the
        // profiles lookup.
        if (user.user_metadata?.onboarded !== true) {
          await supabase.auth.updateUser({ data: { onboarded: true } })
        }

        // Onboarded users honour `next` if provided, else land on /dashboard.
        // Reject "/" so authenticated users don't end up on the public
        // marketing root after sign-in.
        const dest =
          next && next.startsWith('/') && !next.startsWith('//') && next !== '/'
            ? next
            : '/dashboard'
        await capturePostHogEvent({
          distinctId: user.id,
          event: 'user_authenticated',
          properties: {
            source: 'auth_callback',
            destination: dest,
            onboarded: true,
          },
        })
        return NextResponse.redirect(`${origin}${dest}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
