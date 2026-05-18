/**
 * Route registry — the source of truth for which routes get smoke-tested.
 *
 * Group rules:
 *   - public:  expected to return 200 OK without auth; full smoke runs against these
 *              (status + console-clean + a11y basics).
 *   - auth:    expected to redirect unauthenticated visitors to /login; we just
 *              assert the redirect happened, not the destination contents.
 *
 * Add routes here as the app grows — the parameterized specs in
 * tests/smoke.spec.ts and tests/a11y-smoke.spec.ts pick them up automatically.
 */

export type RouteAccess = "public" | "auth";

export interface RouteSpec {
    /** Path to navigate to. */
    path: string;
    /** Auth requirement; controls how the spec asserts. */
    access: RouteAccess;
    /** Optional human label for test names. Defaults to path. */
    label?: string;
}

export const ROUTES: RouteSpec[] = [
    // ── Public ──────────────────────────────────────────────────────────
    { path: "/", access: "public", label: "home" },
    { path: "/login", access: "public", label: "login" },
    { path: "/learn/start", access: "public", label: "learn/start" },

    // ── Auth-gated ──────────────────────────────────────────────────────
    // These redirect unauthenticated visitors to /login. CI has no session,
    // so we assert the redirect rather than the page content. When a fixture
    // user is available, promote these to "public" with seeded auth.
    { path: "/chart", access: "auth", label: "chart" },
    { path: "/dashboard", access: "auth", label: "dashboard" },
];

export const PUBLIC_ROUTES = ROUTES.filter((r) => r.access === "public");
export const AUTH_ROUTES = ROUTES.filter((r) => r.access === "auth");
