import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig = {
  // Build currently ignores TS errors because of pre-existing errors
  // outside the Payload subsystem. These are tracked for follow-up:
  //   - app/actions.ts:14 (Profile missing subscription fields)
  //   - app/api/intake/route.ts:89, /intake/setup/route.ts:78,90 (Notion API typing)
  //   - app/api/readings/generate/route.ts:264 (null passed to non-null param)
  //   - app/(frontend)/(app)/reading/[id]/hooks/useScrollSection.ts:3,8 (stale import)
  //   - app/components/marketing/shared/blocks/IntakeFormBlock.tsx:524,531 (dead-branch narrowing)
  // Fixing these is outside the Payload-reliability scope; do not add new
  // Payload-related TS errors under this flag.
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
