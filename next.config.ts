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
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      // Prisma's custom generated client imports these runtime subpaths directly.
      // Vercel's Next/webpack build fails to resolve them from the external
      // generated directory unless we pin them to the installed runtime files.
      "@prisma/client/runtime/client": path.resolve(
        process.cwd(),
        "node_modules/@prisma/client/runtime/client.js"
      ),
      "@prisma/client/runtime/query_compiler_bg.postgresql.mjs": path.resolve(
        process.cwd(),
        "node_modules/@prisma/client/runtime/query_compiler_bg.postgresql.mjs"
      ),
      "@prisma/client/runtime/query_compiler_bg.postgresql.wasm-base64.mjs": path.resolve(
        process.cwd(),
        "node_modules/@prisma/client/runtime/query_compiler_bg.postgresql.wasm-base64.mjs"
      ),
      "@prisma/client/runtime/query_engine_bg.postgresql.mjs": path.resolve(
        process.cwd(),
        "node_modules/@prisma/client/runtime/query_engine_bg.postgresql.mjs"
      ),
      "@prisma/client/runtime/query_engine_bg.postgresql.wasm-base64.mjs": path.resolve(
        process.cwd(),
        "node_modules/@prisma/client/runtime/query_engine_bg.postgresql.wasm-base64.mjs"
      )
    };

    return config;
  }
};

export default nextConfig;
