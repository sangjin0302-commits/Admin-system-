import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isVercelBuild = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
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
  async redirects() {
    // 서비스 상세 중복 정리: CMS 슬러그 → nav 연결된 legacy 상세로 영구(308) 리다이렉트.
    // (컴포넌트 redirect()는 dev 렌더 캐시 이슈가 있어 config 레벨로 확정 처리.)
    const map: Record<string, string> = {
      visa: "immigration",
      corporation: "corporate",
      "administrative-appeal": "appeal",
      "fact-contract": "contract",
      "permit-license": "license"
    };
    return Object.entries(map).map(([from, to]) => ({
      source: `/services/${from}`,
      destination: `/services/${to}`,
      permanent: true
    }));
  },
  async headers() {
    // 전역 보안 헤더 (클릭재킹/MIME 스니핑/HTTPS 강제/정보 누출 방어)
    const securityHeaders = [
      // X-Frame-Options는 middleware.ts에서 DENY로 통일 (중복 방지)
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

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  tunnelRoute: "/monitoring",
});
