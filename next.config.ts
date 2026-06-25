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
      {
        source: '/westernm2025',
        destination: '/teams/2f0a7ec8-b9b5-4223-b9e7-9938abffe949',
        permanent: false,
      },
      {
        source: '/tuba2025',
        destination: '/teams/0ee681de-8dcb-4d0c-b5f8-3dc0e5896634',
        permanent: false,
      },
      {
        source: '/westernw2025',
        destination: '/teams/1ce50736-9a9d-42ba-a386-6127d3e9f80e',
        permanent: false,
      },
      {
        source: '/devs2026',
        destination: '/teams/6c9796c3-9330-4944-9f10-e5e62a0bca63',
        permanent: false,
      },
      {
        source: '/gbps26',
        destination: '/teams/310a0e94-dbcf-45a9-be43-acfaa42765fb',
        permanent: false,
      },
      {
        source: '/rosess26',
        destination: '/teams/7b2d1083-e20a-4d0c-a5c2-ba4cf1ac04f5',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
