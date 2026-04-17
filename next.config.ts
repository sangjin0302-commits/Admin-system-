import type { NextConfig } from "next";

const isVercelBuild = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  // Keep production output separate from the default .next directory to avoid
  // Windows + OneDrive lock contention during repeated builds.
  distDir: process.env.NODE_ENV === "production" && !isVercelBuild ? ".next-prod" : ".next",
  outputFileTracingRoot: process.cwd(),
  experimental: {
    // Disable the build worker because it previously triggered spawn EPERM
    // under the current Windows environment.
    webpackBuildWorker: false
  }
};

export default nextConfig;
