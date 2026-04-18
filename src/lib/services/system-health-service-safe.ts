export {
  getSystemHealthSnapshot,
  type HealthCheckItem,
  type HealthLevel,
  type SystemHealthSnapshot
} from "./system-health-service-safe-v2";
/*
import { access, mkdir } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma/client";

export type HealthLevel = "ok" | "warn" | "critical";

export type HealthCheckItem = {
  key: string;
  title: string;
  level: HealthLevel;
  summary: string;
  details: string[];
};

export type SystemHealthSnapshot = {
  generatedAt: string;
  overallLevel: HealthLevel;
  score: number;
  items: HealthCheckItem[];
  recommendedActions: string[];
};

function envTrue(name: string, defaultValue = false) {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function envInt(name: string, defaultValue: number, min: number, max: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return defaultValue;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(max, Math.max(min, parsed));
}

function mask(value: string | undefined) {
  if (!value) return "미설정";
  if (value.length <= 4) return "설정됨";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

function getScoreByLevel(level: HealthLevel) {
  if (level === "ok") return 100;
  if (level === "warn") return 70;
  return 25;
}

function summarizeOverallLevel(items: HealthCheckItem[]): HealthLevel {
  if (items.some((item) => item.level === "critical")) return "critical";
  if (items.some((item) => item.level === "warn")) return "warn";
  return "ok";
}

function isStrongPassword(password: string, minimumLength: number) {
  if (password.length < minimumLength) return false;

  let groups = 0;
  if (/[A-Z]/.test(password)) groups += 1;
  if (/[a-z]/.test(password)) groups += 1;
  if (/\d/.test(password)) groups += 1;
  if (/[^A-Za-z0-9]/.test(password)) groups += 1;

  return groups >= 3;
}

function buildAdminSecurityItem(): HealthCheckItem {
  const adminUser = process.env.ADMIN_BASIC_AUTH_USER?.trim();
  const adminPassword = process.env.ADMIN_BASIC_AUTH_PASSWORD?.trim();
  const enforceStrongPassword = envTrue("ADMIN_ENFORCE_STRONG_CREDENTIALS", true);
  const minimumLength = envInt("ADMIN_MIN_PASSWORD_LENGTH", 14, 10, 64);
  const requireSameOrigin = envTrue("ADMIN_REQUIRE_SAME_ORIGIN", true);
  const forceHttps = envTrue("FORCE_HTTPS", process.env.NODE_ENV === "production");
  const ipAllowlist = process.env.ADMIN_IP_ALLOWLIST?.trim() ?? "";
  const maxFailures = envInt("ADMIN_AUTH_RATE_LIMIT_MAX_FAILURES", 20, 5, 200);
  const windowMs = envInt("ADMIN_AUTH_RATE_LIMIT_WINDOW_MS", 10 * 60 * 1000, 60_000, 60 * 60 * 1000);

  const hasCredentials = Boolean(adminUser && adminPassword);
  const strongEnough =
    !enforceStrongPassword || (adminPassword ? isStrongPassword(adminPassword, minimumLength) : false);

  let level: HealthLevel = "ok";
  if (!hasCredentials || !strongEnough) {
    level = "critical";
  } else if (!requireSameOrigin || !forceHttps || !ipAllowlist) {
    level = "warn";
  }

  return {
    key: "admin-security",
    title: "관리자 보안 설정",
    level,
    summary:
      level === "critical"
        ? "관리자 인증 설정이 운영 기준을 충족하지 않습니다."
        : level === "warn"
          ? "관리자 인증은 동작하지만 보안 보강이 필요합니다."
          : "관리자 인증과 기본 보안 설정이 정상입니다.",
    details: [
      `관리자 계정: ${mask(adminUser)}`,
      `강한 비밀번호 강제: ${enforceStrongPassword ? "사용" : "미사용"}`,
      `최소 비밀번호 길이: ${minimumLength}`,
      `인증 실패 제한: ${maxFailures}회 / ${Math.round(windowMs / 1000)}초`,
      `Same-Origin 검증: ${requireSameOrigin ? "사용" : "미사용"}`,
      `HTTPS 강제: ${forceHttps ? "사용" : "미사용"}`,
      `IP 허용목록: ${ipAllowlist ? "설정됨" : "미설정"}`
    ]
  };
}

async function buildDatabaseItem(): Promise<HealthCheckItem> {
  const provider = process.env.PRISMA_DB_PROVIDER?.trim() || "sqlite";
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const details = [
    `DB Provider: ${provider}`,
    `DATABASE_URL: ${databaseUrl ? "설정됨" : "미설정"}`
  ];

  if (!databaseUrl) {
    return {
      key: "database",
      title: "데이터베이스 연결",
      level: "critical",
      summary: "DATABASE_URL이 없어 데이터 접근이 불가능합니다.",
      details
    };
  }

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    return {
      key: "database",
      title: "데이터베이스 연결",
      level: "ok",
      summary: "데이터베이스 연결이 정상입니다.",
      details
    };
  } catch (error) {
    return {
      key: "database",
      title: "데이터베이스 연결",
      level: "critical",
      summary: "데이터베이스 연결 테스트에 실패했습니다.",
      details: [...details, `오류: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}

function buildLawbotItem(): HealthCheckItem {
  const url = process.env.LAWBOT_ANALYZE_URL?.trim();
  const token = process.env.LAWBOT_ANALYZE_TOKEN?.trim();
  const timeoutMs = envInt("LAWBOT_ANALYZE_TIMEOUT_MS", 8000, 1000, 60_000);

  const level: HealthLevel = url && token ? "ok" : "warn";
  return {
    key: "lawbot",
    title: "Lawbot 연동",
    level,
    summary:
      url && token
        ? "Lawbot 분석 호출 준비가 완료되었습니다."
        : "Lawbot 연결 설정이 부분적으로 누락되어 있습니다.",
    details: [
      `분석 URL: ${url ? "설정됨" : "미설정"}`,
      `분석 토큰: ${token ? "설정됨" : "미설정"}`,
      `요청 타임아웃: ${timeoutMs}ms`
    ]
  };
}

function buildNotionItem(): HealthCheckItem {
  const enabled = envTrue("NOTION_SYNC_ENABLED", false);
  const notionToken = process.env.NOTION_TOKEN?.trim();
  const consultationDb = process.env.NOTION_CONSULTATION_DATABASE_ID?.trim();
  const caseDb = process.env.NOTION_CASE_DATABASE_ID?.trim();
  const configured = Boolean(notionToken && consultationDb);

  const level: HealthLevel = enabled ? (configured ? "ok" : "warn") : "ok";
  return {
    key: "notion",
    title: "Notion 동기화",
    level,
    summary:
      enabled && configured
        ? "Notion 동기화가 활성화되어 있습니다."
        : enabled
          ? "Notion 동기화에 필요한 설정이 부족합니다."
          : "Notion 동기화는 비활성화 상태입니다.",
    details: [
      `동기화 사용: ${enabled ? "예" : "아니오"}`,
      `Notion 토큰: ${notionToken ? "설정됨" : "미설정"}`,
      `상담 DB: ${consultationDb ? "설정됨" : "미설정"}`,
      `사건 DB: ${caseDb ? "설정됨" : "미설정"}`
    ]
  };
}

async function buildStorageItem(): Promise<HealthCheckItem> {
  const provider = process.env.PRISMA_DB_PROVIDER?.trim() || "sqlite";
  const databaseUrl = process.env.DATABASE_URL?.trim() || "";
  const marketingPath =
    process.env.AUTOPOST_MARKETING_PAYLOAD_PATH?.trim() ||
    path.join(process.cwd(), "data", "marketing-sync-latest.json");

  const details = [`스토리지 기준: ${provider}`, `마케팅 스냅샷 경로: ${marketingPath}`];

  try {
    await mkdir(path.dirname(marketingPath), { recursive: true });
    await access(path.dirname(marketingPath));
  } catch (error) {
    return {
      key: "storage",
      title: "스토리지/백업 경로",
      level: "warn",
      summary: "스냅샷 경로 접근에 문제가 있습니다.",
      details: [...details, `오류: ${error instanceof Error ? error.message : String(error)}`]
    };
  }

  const sqliteOnOneDrive =
    provider === "sqlite" &&
    databaseUrl.toLowerCase().includes("onedrive");

  if (sqliteOnOneDrive) {
    return {
      key: "storage",
      title: "스토리지/백업 경로",
      level: "warn",
      summary: "OneDrive 기반 SQLite는 파일 잠금 위험이 있어 운영 DB로 권장되지 않습니다.",
      details: [...details, "권장: Railway Postgres + 자동 백업(PITR)"]
    };
  }

  return {
    key: "storage",
    title: "스토리지/백업 경로",
    level: "ok",
    summary: "백업 스냅샷 경로 접근이 정상입니다.",
    details
  };
}

function buildRecommendedActions(items: HealthCheckItem[]) {
  const actions: string[] = [];

  for (const item of items) {
    if (item.key === "admin-security" && item.level !== "ok") {
      actions.push("관리자 비밀번호를 강한 조합으로 변경하고 IP 허용목록을 점검하세요.");
    }
    if (item.key === "database" && item.level === "critical") {
      actions.push("DATABASE_URL과 Railway 연결 상태를 먼저 확인하세요.");
    }
    if (item.key === "lawbot" && item.level !== "ok") {
      actions.push("Lawbot URL/토큰 설정을 완료한 뒤 사건 상세에서 재분석 테스트를 수행하세요.");
    }
    if (item.key === "notion" && item.level !== "ok") {
      actions.push("Notion 동기화를 사용할 경우 토큰과 DB ID를 모두 설정하세요.");
    }
    if (item.key === "storage" && item.level !== "ok") {
      actions.push("운영 DB는 Railway Postgres를 사용하고 백업 정책을 주기적으로 점검하세요.");
    }
  }

  if (actions.length === 0) {
    actions.push("현재 상태는 안정적입니다. 주 1회 모니터링 점검을 유지하세요.");
  }

  return actions;
}

export async function getSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  const items: HealthCheckItem[] = [
    buildAdminSecurityItem(),
    await buildDatabaseItem(),
    buildLawbotItem(),
    buildNotionItem(),
    await buildStorageItem()
  ];

  const score = Math.round(
    items.reduce((acc, item) => acc + getScoreByLevel(item.level), 0) /
      items.length
  );

  return {
    generatedAt: new Date().toISOString(),
    overallLevel: summarizeOverallLevel(items),
    score,
    items,
    recommendedActions: buildRecommendedActions(items)
  };
}
*/
