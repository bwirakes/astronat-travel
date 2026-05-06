import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
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

const AUTH_ENTRY_PREFIXES = ["/login", "/flow"] as const;

function startsWithPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => startsWithPath(pathname, prefix));
}

function isAuthEntryPath(pathname: string): boolean {
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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
      "placeholder",
    {
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
    },
  );

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
    const { data: profile } = await supabase
      .from("profiles")
      .select("birth_date")
      .eq("id", user.id)
      .maybeSingle();

    const hasBirthDate = Boolean(profile?.birth_date);
    if (!hasBirthDate && startsWithPath(pathname, "/flow")) {
      return response;
    }

    const destination = hasBirthDate ? "/dashboard" : "/flow?step=1";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
}

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
