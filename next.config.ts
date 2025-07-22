import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  async redirects() {
    return [
      { // TODO LATER: remove after more than devs
        source: '/',
        destination: '/teams/b3836ba2-c6f1-4e67-8d5b-afecd7c486ec',
        permanent: false,
      },
      {
        source: '/test',
        destination: '/teams/2e7603c3-c6be-419c-be32-4c9391c288da',
        permanent: false,
      }
    ]
  }
};

export default nextConfig;
