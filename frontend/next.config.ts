import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'viem', 'wagmi'],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@farcaster/mini-app-solana': false,
      '@metamask/connect-evm': false,
      accounts: false,
      'pino-pretty': false,
    };
    return config;
  },
};

export default nextConfig;
