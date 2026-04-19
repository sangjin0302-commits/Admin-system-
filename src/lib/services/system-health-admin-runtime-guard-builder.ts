import type { HealthCheckItem } from "@/lib/services/system-health-types";
import { envInt, mask } from "@/lib/services/system-health-utils";

export function buildAdminRuntimeGuardItem(): HealthCheckItem {
  const isProduction = process.env.NODE_ENV === "production";

  const adminUser = process.env.ADMIN_BASIC_AUTH_USER?.trim();
  const adminPassword = process.env.ADMIN_BASIC_AUTH_PASSWORD?.trim();
  const hasAdminCredentials = Boolean(adminUser && adminPassword);

  const marketingSyncToken = process.env.ADMIN_MARKETING_SYNC_TOKEN?.trim() ?? "";
  const marketingTokenMinLength = envInt("ADMIN_MARKETING_SYNC_TOKEN_MIN_LENGTH", 24, 12, 128);
  const hasValidMarketingSyncToken = marketingSyncToken.length >= marketingTokenMinLength;

  let level: "ok" | "warn" | "critical" = "ok";
  if (isProduction && !hasAdminCredentials) {
    level = "critical";
  } else if (!hasValidMarketingSyncToken) {
    level = "warn";
  }

  const runtimeGateLabel = isProduction
    ? hasAdminCredentials
      ? "운영 보호 활성"
      : "운영 보호 비활성"
    : "개발 모드(운영 강제 아님)";

  return {
    key: "admin-runtime-guard",
    title: "관리자 런타임 보호",
    level,
    summary:
      level === "critical"
        ? "운영 환경에서 관리자 인증 게이트가 활성화되지 않았습니다."
        : level === "warn"
          ? "관리자 인증 게이트는 동작 가능하지만 연동 토큰 안전 기준이 부족합니다."
          : "운영 환경 보호 기준(관리자 인증/토큰)이 정상 상태입니다.",
    details: [
      `NODE_ENV: ${process.env.NODE_ENV ?? "unknown"}`,
      `런타임 게이트 상태: ${runtimeGateLabel}`,
      `ADMIN_BASIC_AUTH_USER: ${mask(adminUser)}`,
      `ADMIN_MARKETING_SYNC_TOKEN: ${marketingSyncToken ? "설정됨" : "미설정"}`,
      `토큰 최소 길이 기준: ${marketingTokenMinLength}`,
      `마케팅 ingest 토큰 보호: ${hasValidMarketingSyncToken ? "사용" : "미사용"}`
    ]
  };
}
