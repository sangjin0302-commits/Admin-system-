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
  // 빌드 메모리 절감 — Vercel 빌드 OOM(exit 137) 방지 보강.
  productionBrowserSourceMaps: false,
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
    webpackBuildWorker: false,
    // 빌드 시 webpack 메모리 최적화(Next 15) — 대규모 라우트 빌드 OOM 완화.
    webpackMemoryOptimizations: true
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
      // Cross-Origin isolation 정적 헤더. 값이 요청과 무관하므로 미들웨어가 아니라
      // 여기서 전역 적용한다(=미들웨어 미실행 경로에서도 보장되는 defense-in-depth).
      // 동적 CSP(nonce)는 계속 middleware.ts 에서만 발급한다.
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      { key: "X-DNS-Prefetch-Control", value: "on" }
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
  }
};

// Sentry 소스맵 빌드 플러그인은 메모리를 많이 써서 Vercel 빌드가 OOM(exit 137)로
// 죽는 원인이 됐다. 실제 업로드가 가능한 경우(SENTRY_AUTH_TOKEN + org/project)에만
// 적용하고, 그때도 widenClientFileUpload 를 꺼서 처리량을 줄인다. 런타임 에러 수집
// (sentry.*.config)은 이 래퍼와 무관하게 계속 동작한다.
const sentryUploadEnabled = !!(
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT
);

export default sentryUploadEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: false,
      disableLogger: true,
      tunnelRoute: "/monitoring",
    })
  : nextConfig;
