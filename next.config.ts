import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const supabaseHost = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).hostname : undefined;
  } catch {
    return undefined;
  }
})();

const s3Host = (() => {
  try {
    const endpoint = process.env.S3_ENDPOINT;
    return endpoint ? new URL(endpoint).hostname : undefined;
  } catch {
    return undefined;
  }
})();

const remotePatterns: { protocol: "https"; hostname: string }[] = [];
if (supabaseHost) remotePatterns.push({ protocol: "https", hostname: supabaseHost });
if (s3Host) remotePatterns.push({ protocol: "https", hostname: s3Host });

const nextConfig = {
  // Build currently ignores TS errors because of pre-existing errors; tracked for follow-up.
  typescript: {
    ignoreBuildErrors: true,
  },

  // swisseph-wasm uses createRequire("module") which webpack can't bundle.
  // Keep it external so Node resolves it at runtime on the server.
  serverExternalPackages: ["swisseph-wasm", "geo-tz"],

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-accordion",
      "@radix-ui/react-hover-card",
      "@base-ui/react",
    ],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    remotePatterns,
  },

  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },

  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://js.stripe.com https://*.vercel-insights.com https://*.posthog.com https://*.i.posthog.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://*.posthog.com https://*.i.posthog.com https://*.vercel-insights.com https://vitals.vercel-insights.com https://*.sentry.io https://*.ingest.sentry.io https://api.mapbox.com https://nominatim.openstreetmap.org https://www.google.com https://api.stripe.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.google.com",
      "worker-src 'self' blob:",
      "media-src 'self' blob: data:",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self)" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },

  skipTrailingSlashRedirect: true,

  async redirects() {
    return [
      // Signup lives at /flow step 0 — collapse all signup surfaces.
      { source: '/signup', destination: '/flow', permanent: true },
      { source: '/signup/', destination: '/flow', permanent: true },
      { source: '/auth/signup', destination: '/flow', permanent: true },
      { source: '/auth/signup/', destination: '/flow', permanent: true },
      // Old /home → new /dashboard
      { source: '/home', destination: '/dashboard', permanent: true },
      // Old /auth/* → flattened (auth) routes
      { source: '/auth/login', destination: '/login', permanent: false },
      { source: '/auth/login/', destination: '/login', permanent: false },
      // Old flat app routes still served by (app) group — no change needed for /chart, /flow, etc.
    ];
  },
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
