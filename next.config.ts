import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/devs2025',
        destination: '/teams/b3836ba2-c6f1-4e67-8d5b-afecd7c486ec',
        permanent: false,
      },
      {
        source: '/test',
        destination: '/teams/2e7603c3-c6be-419c-be32-4c9391c288da',
        permanent: false,
      },
      {
        source: '/gbp',
        destination: '/teams/e54aed7e-92b8-4915-9cc1-47fdb3ca9636',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
