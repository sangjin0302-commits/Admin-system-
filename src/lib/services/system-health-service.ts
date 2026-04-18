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

function envInt(name: string, defaultValue: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return defaultValue;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return defaultValue;
  return parsed;
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
  const minimumLength = Math.max(10, envInt("ADMIN_MIN_PASSWORD_LENGTH", 14));
  const requireSameOrigin = envTrue("ADMIN_REQUIRE_SAME_ORIGIN", true);
  const forceHttps = envTrue("FORCE_HTTPS", process.env.NODE_ENV === "production");
  const ipAllowlist = process.env.ADMIN_IP_ALLOWLIST?.trim() ?? "";
  const maxFailures = Math.max(1, envInt("ADMIN_AUTH_RATE_LIMIT_MAX_FAILURES", 20));
  const windowMs = Math.max(10_000, envInt("ADMIN_AUTH_RATE_LIMIT_WINDOW_MS", 600_000));

  const hasCredentials = Boolean(adminUser && adminPassword);
  const strongEnough =
    !enforceStrongPassword || (adminPassword ? isStrongPassword(adminPassword, minimumLength) : false);

  let level: HealthLevel = "ok";
  const details = [
    `관리자 계정: ${mask(adminUser)}`,
    `비밀번호 강도 정책: ${enforceStrongPassword ? "강제" : "완화"}`,
    `최소 비밀번호 길이: ${minimumLength}자`,
    `인증 실패 제한: ${maxFailures}회 / ${Math.round(windowMs / 1000)}초`,
    `Same-Origin 검증: ${requireSameOrigin ? "사용" : "미사용"}`,
    `HTTPS 강제: ${forceHttps ? "사용" : "미사용"}`,
    `IP 허용목록: ${ipAllowlist ? "설정됨" : "미설정"}`
  ];

  if (!hasCredentials || !strongEnough) {
    level = "critical";
  } else if (!requireSameOrigin || !forceHttps || !ipAllowlist) {
    level = "warn";
  }

  const summary =
    level === "critical"
      ? "관리자 인증 설정이 안전 기준을 충족하지 않습니다."
      : level === "warn"
        ? "관리자 보안은 동작 중이나 운영 기준 보강이 필요합니다."
        : "관리자 인증과 기본 보안 장치가 안정적으로 설정되었습니다.";

  return {
    key: "admin-security",
    title: "관리자 보안 설정",
    level,
    summary,
    details
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
      summary: "DATABASE_URL이 없어 데이터 저장이 불가능합니다.",
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
      summary: "데이터베이스 연결 점검에 실패했습니다.",
      details: [...details, `오류: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}

function buildLawbotItem(): HealthCheckItem {
  const url = process.env.LAWBOT_ANALYZE_URL?.trim();
  const token = process.env.LAWBOT_ANALYZE_TOKEN?.trim();
  const timeoutMs = envInt("LAWBOT_ANALYZE_TIMEOUT_MS", 8000);
  const enabled = Boolean(url);

  const level: HealthLevel = url && token ? "ok" : enabled ? "warn" : "warn";
  const summary = url && token
    ? "Lawbot 실연결 구성이 준비되었습니다."
    : enabled
      ? "Lawbot URL은 있으나 토큰이 없어 제한 상태입니다."
      : "Lawbot 연결이 아직 비활성 상태입니다.";

  return {
    key: "lawbot",
    title: "Lawbot 연동",
    level,
    summary,
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
  const summary = enabled
    ? configured
      ? "Notion 동기화가 활성화되어 있습니다."
      : "Notion 동기화가 켜져 있으나 필수 값이 누락되었습니다."
    : "Notion 동기화는 비활성화 상태입니다.";

  return {
    key: "notion",
    title: "Notion 동기화",
    level,
    summary,
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
      title: "스토리지/백업 가능성",
      level: "warn",
      summary: "마케팅 스냅샷 저장 경로 접근이 불안정합니다.",
      details: [...details, `오류: ${error instanceof Error ? error.message : String(error)}`]
    };
  }

  const sqliteOnOneDrive =
    provider === "sqlite" &&
    databaseUrl.toLowerCase().includes("onedrive");

  if (sqliteOnOneDrive) {
    return {
      key: "storage",
      title: "스토리지/백업 가능성",
      level: "warn",
      summary: "OneDrive 기반 SQLite는 잠금 충돌 위험이 있어 운영용으로 권장되지 않습니다.",
      details: [...details, "권장: Railway Postgres + 자동 백업(PITR)"]
    };
  }

  return {
    key: "storage",
    title: "스토리지/백업 가능성",
    level: "ok",
    summary: "현재 저장 경로와 스냅샷 저장 가능 상태가 정상입니다.",
    details
  };
}

function buildRecommendedActions(items: HealthCheckItem[]) {
  const actions: string[] = [];

  for (const item of items) {
    if (item.key === "admin-security" && item.level !== "ok") {
      actions.push("관리자 비밀번호를 16자 이상 강한 조합으로 변경하고 IP 허용목록을 설정하세요.");
    }
    if (item.key === "database" && item.level === "critical") {
      actions.push("DATABASE_URL과 Railway 연결 상태를 즉시 점검하고 재배포 전 연결 테스트를 수행하세요.");
    }
    if (item.key === "lawbot" && item.level !== "ok") {
      actions.push("Lawbot URL/토큰을 설정해 실사건 분석 흐름을 안정화하세요.");
    }
    if (item.key === "notion" && item.level !== "ok") {
      actions.push("Notion 동기화가 필요하면 토큰과 DB ID를 모두 설정하세요.");
    }
    if (item.key === "storage" && item.level !== "ok") {
      actions.push("운영 DB를 Railway Postgres로 고정하고 자동 백업 정책을 확인하세요.");
    }
  }

  if (actions.length === 0) {
    actions.push("현재 상태는 안정적입니다. 주 1회 모니터링 페이지 점검으로 상태를 유지하세요.");
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

  const score = Math.round(items.reduce((acc, item) => acc + getScoreByLevel(item.level), 0) / items.length);

  return {
    generatedAt: new Date().toISOString(),
    overallLevel: summarizeOverallLevel(items),
    score,
    items,
    recommendedActions: buildRecommendedActions(items)
  };
}
*/
