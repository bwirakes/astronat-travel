import posthog from "posthog-js";

// Skip PostHog init when no token is configured. Without this guard,
// posthog-js logs a console error every page load:
//   [PostHog.js] PostHog was initialized without a token.
// That noise fails our smoke spec and is meaningless in environments
// without analytics credentials (CI, local dev without .env).
const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
if (posthogToken) {
  posthog.init(posthogToken, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
}
