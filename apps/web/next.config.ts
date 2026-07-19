import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Transpile our workspace packages (they ship raw TS, not built dist).
  transpilePackages: ['@nearbite/contracts', '@nearbite/core'],
  typedRoutes: true,
  // We run ESLint + tsc as separate CI gates (pnpm lint / typecheck), so don't
  // re-run/block the production build on them — Next fails the build on any lint
  // warning by default, which is stricter than our gates and env-sensitive.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
