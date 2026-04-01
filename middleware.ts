import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'placeholder',
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isDemo = request.nextUrl.searchParams.get('demo') === 'true'

  // ── Routes that require login (but NOT a subscription) ──────────────────────
  // /flow itself is the signup + paywall, so it must be publicly accessible.
  // /profile lets users manage their billing even if subscription lapsed.
  const authOnlyRoutes = ['/profile', '/flow']
  const isAuthOnlyRoute = authOnlyRoutes.some(r => pathname.startsWith(r))

  // ── Routes that require login AND an active subscription ────────────────────
  const subscribedRoutes = ['/home', '/onboarding', '/birthday', '/couples', '/goals', '/readings', '/reading', '/chart']
  const isSubscribedRoute = subscribedRoutes.some(r => pathname.startsWith(r))

  // 1. Not logged in → bounce to login for any protected route
  if (!user && !isDemo && (isAuthOnlyRoute || isSubscribedRoute)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 2. Logged in but hitting /auth/* → redirect to home (or flow if not subscribed)
  if (user && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // 3. Logged in, hitting a subscription-gated route → check is_subscribed
  if (user && isSubscribedRoute && !isDemo) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_subscribed')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_subscribed) {
      // Not subscribed → send to paywall step
      return NextResponse.redirect(new URL('/flow?step=1', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
