import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig = {
  // --- IGNORE TS ERRORS DURING BUILD ---
  typescript: {
    ignoreBuildErrors: true,
  },

  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/login',
        permanent: false,
      },
      // Legacy auth redirects
      { source: '/auth/signup', destination: '/flow', permanent: true },
      { source: '/auth/signup/', destination: '/flow', permanent: true },
      // Old /home → new /dashboard
      { source: '/home', destination: '/dashboard', permanent: true },
      // Old /auth/* → flattened (auth) routes
      { source: '/auth/login', destination: '/login', permanent: false },
      { source: '/auth/login/', destination: '/login', permanent: false },
      // Old flat app routes still served by (app) group — no change needed for /chart, /flow, etc.
      // Mockup routes → /mockup/* namespace
      { source: '/mockup-acg', destination: '/mockup/acg', permanent: true },
      { source: '/mockup-chart-example', destination: '/mockup/chart-example', permanent: true },
      { source: '/mockup-natal', destination: '/mockup/natal', permanent: true },
      { source: '/mockup-reading', destination: '/mockup/reading', permanent: true },
      { source: '/mockup-reading-version-1', destination: '/mockup/reading-version-1', permanent: true },
      { source: '/mockup-reading-version-2', destination: '/mockup/reading-version-2', permanent: true },
      { source: '/mockup-relocation-1', destination: '/mockup/relocation-1', permanent: true },
      { source: '/mockup-relocation-2', destination: '/mockup/relocation-2', permanent: true },
      { source: '/mock-reading-design', destination: '/mockup/reading-design', permanent: true },
    ];
  },
};


export default withPayload(nextConfig);
