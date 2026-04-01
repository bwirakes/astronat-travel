# Prompt 02 — Authentication (Login + Signup)

**Phase:** 1 | **Deadline:** April 5, 2026 | **Priority:** P0

---

## Read These First

Before writing any code, read these files completely:

1. **`.agents/skills/astro-design/SKILL.md`** — All UI components must follow this. Typography, colors, shapes, SVG assets.
2. **`app/globals.css`** — Never hardcode hex values or font strings. Use CSS variables only.
3. **`docs/prd/mvp-requirements.md`** — Auth decisions: Section "Technical Decisions" (Supabase).
4. **`package.json`** — Tech stack already installed (Next.js 16, Shadcn, Tailwind, framer-motion).

---

## Context

Astronat needs two distinct authentication flows with different routing logic:

| User State | Entry Point | Flow | Destination |
|-----------|-------------|------|-------------|
| New user | Sign up | Flow Wizard `app/flow` Screen 6 | `app/home?finalize_onboarding=true` |
| Returning user | Log in | Email/Google → Skip onboarding if profile exists | `app/home` |
| Unauthenticated visitor | Landing page | CTA button → Sign up flow | `app/flow` |

**What NOT to build:**
- ❌ Custom password screens — OAuth + Magic Link only
- ❌ Email verification flows — Supabase handles this
- ❌ Custom session management — use `@supabase/ssr`

---

## Tech Setup

### 1. Install packages

```bash
bun add @supabase/supabase-js @supabase/ssr
```

### 2. Environment variables

Add to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 3. Supabase client helpers

Create `lib/supabase/client.ts` (browser client):

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `lib/supabase/server.ts` (server client):

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
}
```

### 4. Middleware

Create `middleware.ts` in project root:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Protect all /home, /onboarding routes
  if (!user && (request.nextUrl.pathname.startsWith('/home') || request.nextUrl.pathname.startsWith('/onboarding'))) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If logged in user hits /auth routes, redirect to home
  if (user && request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
```

### 5. Auth callback route

Create `app/auth/callback/route.ts`:

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
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
```

---

## Post-Onboarding Handoff

When a new user finishes the Onboarding Wizard (Prompt 03), their data is saved in `localStorage` prior to authentication. When the OAuth callback redirects them to `/home?finalize_onboarding=true`, the `app/home/page.tsx` client component must:
1. Read the `OnboardingData` from `localStorage`
2. Call the `lib/db.ts` helpers to `createProfile()` and `saveSearch()`
3. Clear the `localStorage`
4. Remove the `?finalize_onboarding=true` query parameter

This ensures seamless data consistency without the user ever having to re-input their birth data or goals again.

---

## UI Implementation

### Login page — `app/auth/login/page.tsx`

**Design rules (from `.agents/skills/astro-design/SKILL.md`):**
- Background: `var(--color-charcoal)` (dark default)
- Card: `var(--surface)` background, `1px solid var(--surface-border)` border — NO box-shadow
- Headline: `var(--font-primary)` (BETTER DAYS), uppercase
- CTA button: `btn-primary` class with `var(--shape-asymmetric-md)` border-radius, `var(--color-y2k-blue)` background
- Magic Link input: `.input-field` class from globals.css

**Required elements:**
1. Saturn logo mark: `<img src="/saturn-monogram.svg" />` (apply `filter: invert(1)` for dark bg)
2. Headline: `"Welcome back."` — `var(--font-primary)`, clamp(3rem, 5vw, 5rem)
3. Google OAuth button — styled with `btn-primary`, Google icon via `lucide-react`
4. Magic Link form — email input (`.input-field`), submit button, success state ("Check your email ✨")
5. "Don't have an account? Sign up" link → `/auth/signup`

### Signup page — `app/flow/page.tsx` (Screen 6 Gate)

**Design rules:**
1. Integrated seamlessly into Screen 6 of the `app/flow` component.
2. Before calling `signInWithOAuth` or `signInWithOtp`, the component saves the `store` data to `localStorage` (key: `onboardingData`).
3. After OAuth/Magic Link auth → the callback handles routing them to `/home?finalize_onboarding=true` to process the storage.
4. "Already have an account? Log in" links users to the dedicated `/auth/login` portal.

---

## Supabase Dashboard Setup

Enable in Supabase Dashboard:
1. **Authentication → Providers**: Enable Google (OAuth credentials), enable Email (Magic Link)
2. **Authentication → URL Configuration**: Add `http://localhost:3000/auth/callback` and production URL
3. **Google OAuth**: Create credentials in Google Cloud Console, add client ID/secret to Supabase

---

## Design Checklist

Before committing, verify:
- [ ] No hardcoded hex colors — using `var(--color-*)` tokens
- [ ] No hardcoded font strings — using `var(--font-*)` tokens
- [ ] Buttons use `.btn-primary` class or `var(--shape-asymmetric-md)` border-radius
- [ ] No `box-shadow` — using border + bg contrast instead
- [ ] Saturn logo visible in navbar/header
- [ ] Login and Signup have distinct headlines and flows
- [ ] Middleware protects `/home` routes
- [ ] New user callback correctly routes to `/home?finalize_onboarding=true` to process local storage data
