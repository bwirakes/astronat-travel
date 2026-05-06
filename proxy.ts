import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/readings",
  "/reading",
  "/profile",
  "/birthday",
  "/goals",
  "/couples",
  "/chart",
  "/learn",
  "/mundane",
  "/geodetic-patterns",
  "/scoring",
] as const;

export const AUTH_ENTRY_PREFIXES = ["/login", "/flow"] as const;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "proxy.ts: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) must be set",
  );
}

export function startsWithPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => startsWithPath(pathname, prefix));
}

export function isAuthEntryPath(pathname: string): boolean {
  return AUTH_ENTRY_PREFIXES.some((prefix) => startsWithPath(pathname, prefix));
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = isProtectedPath(pathname);
  const isAuthEntry = isAuthEntryPath(pathname);

  if (!isProtected && !isAuthEntry) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (!isProtected) {
      return response;
    }
    const nextParam = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(new URL(`/login?next=${nextParam}`, request.url));
  }

  if (isAuthEntry) {
    // Prefer the onboarded flag stored on the auth user (set when birth_date
    // is first written). Falls back to the profiles row only when the flag
    // hasn't been backfilled yet, so the common path stays edge-fast.
    let hasBirthDate = user.user_metadata?.onboarded === true;
    if (!hasBirthDate) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("birth_date")
        .eq("id", user.id)
        .maybeSingle();
      hasBirthDate = Boolean(profile?.birth_date);
    }

    if (!hasBirthDate && startsWithPath(pathname, "/flow")) {
      return response;
    }

    const destination = hasBirthDate ? "/dashboard" : "/flow?step=1";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
}

// Next.js requires `config.matcher` to be a static array literal so it can be
// analyzed at build time — we can't compute it from PROTECTED_PREFIXES /
// AUTH_ENTRY_PREFIXES. The proxy-paths test asserts the two stay in sync.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/readings/:path*",
    "/reading/:path*",
    "/profile/:path*",
    "/birthday/:path*",
    "/goals/:path*",
    "/couples/:path*",
    "/chart/:path*",
    "/learn/:path*",
    "/mundane/:path*",
    "/geodetic-patterns/:path*",
    "/scoring/:path*",
    "/login/:path*",
    "/flow/:path*",
  ],
};
