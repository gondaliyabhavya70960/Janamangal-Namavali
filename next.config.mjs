import withSerwistInit from "@serwist/next";

/**
 * Serwist powers the offline-first service worker. The worker source lives at
 * `app/sw.ts` and is compiled to `public/sw.js` during the build. It is disabled
 * in development so we never fight a stale cache while iterating.
 */
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Linting is enforced via `pnpm lint` / CI rather than blocking production builds.
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
};

export default withSerwist(nextConfig);
