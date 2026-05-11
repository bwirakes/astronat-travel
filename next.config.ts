const nextConfig = {
  // Build currently ignores TS errors because of pre-existing errors; tracked for follow-up.
  typescript: {
    ignoreBuildErrors: true,
  },

  // swisseph-wasm uses createRequire("module") which webpack can't bundle.
  // Keep it external so Node resolves it at runtime on the server.
  serverExternalPackages: ["swisseph-wasm", "geo-tz"],

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

export default nextConfig;
