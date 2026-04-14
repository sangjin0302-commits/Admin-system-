import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep production output separate from the default .next directory to avoid
  // Windows + OneDrive lock contention during repeated builds.
  distDir: process.env.NODE_ENV === "production" ? ".next-prod" : ".next",
  outputFileTracingRoot: path.resolve(process.cwd(), ".."),
  serverExternalPackages: [
    "@prisma/adapter-pg",
    "@prisma/adapter-better-sqlite3",
    "@prisma/client",
    "better-sqlite3",
    "pg"
  ],
  experimental: {
    // Disable the build worker because it previously triggered spawn EPERM
    // under the current Windows environment.
    webpackBuildWorker: false,
    externalDir: true
  }
};

export default nextConfig;
