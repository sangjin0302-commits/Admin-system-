import type { NextConfig } from "next";

const isVercelBuild = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  // Keep production output separate from the default .next directory to avoid
  // Windows + OneDrive lock contention during repeated builds.
  distDir: process.env.NODE_ENV === "production" && !isVercelBuild ? ".next-local" : ".next",
  outputFileTracingRoot: process.cwd(),
  eslint: {
    // Lint is executed separately in local verification scripts.
    ignoreDuringBuilds: true
  },
  typescript: {
    // Type-check is executed by `npm run typecheck`.
    ignoreBuildErrors: true
  },
  experimental: {
    // Disable the build worker because it previously triggered spawn EPERM
    // under the current Windows environment.
    webpackBuildWorker: false
  },
  webpack: (config, { dev }) => {
    if (!isVercelBuild && !dev) {
      // Avoid webpack filesystem cache rename EPERM on OneDrive-backed paths.
      config.cache = false;
    }
    return config;
  }
};

export default nextConfig;
