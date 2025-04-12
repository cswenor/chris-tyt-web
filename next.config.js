/** @type {import('next').NextConfig} */
import { webpackFallback } from '@txnlab/use-wallet-react';

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ...webpackFallback,
      };
    }
    return config;
  },
};

export default nextConfig;