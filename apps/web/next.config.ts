import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Transpile our workspace packages (they ship raw TS, not built dist).
  transpilePackages: ['@nearbite/contracts', '@nearbite/core', '@nearbite/db'],
  typedRoutes: true,
};

export default nextConfig;
