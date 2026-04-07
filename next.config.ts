import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/auth/signup',
        destination: '/flow',
        permanent: true,
      },
      {
        source: '/auth/signup/',
        destination: '/flow',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
