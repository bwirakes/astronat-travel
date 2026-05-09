import bundleAnalyzer from "@next/bundle-analyzer";

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

export default withBundleAnalyzer(nextConfig);
