import type { NextConfig } from "next";

const isVercelBuild = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  // Keep production output separate from the default .next directory to avoid
  // Windows + OneDrive lock contention during repeated builds.
  distDir: process.env.NODE_ENV === "production" && !isVercelBuild ? ".next-local" : ".next",
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/*": ["./generated/prisma-client-next/**/*"]
  },
  serverExternalPackages: ["@prisma/client"],
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
  },
  async headers() {
    // 전역 보안 헤더 (클릭재킹/MIME 스니핑/HTTPS 강제/정보 누출 방어)
    const securityHeaders = [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload"
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()"
      },
      { key: "X-DNS-Prefetch-Control", value: "on" }
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
  }
};

export default nextConfig;
