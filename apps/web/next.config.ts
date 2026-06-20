import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
};

// Sentry source-map upload only runs when SENTRY_AUTH_TOKEN is set (e.g. in CI/CD with a real
// Sentry project); without it the plugin silently skips the upload step. Error reporting itself
// only activates once NEXT_PUBLIC_SENTRY_DSN is set - see instrumentation.ts / instrumentation-client.ts.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: false,
  webpack: {
    automaticVercelMonitors: false,
    treeshake: { removeDebugLogging: true },
  },
});
