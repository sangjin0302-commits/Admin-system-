import { access, mkdir } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma/client";
import { getPublicIntakeControlSnapshot } from "@/lib/services/public-intake-control-service-safe-v3";
import type { HealthCheckItem } from "@/lib/services/system-health-types";
import {
  boolLabel,
  envInt,
  envTrue,
  isStrongPassword,
  mask
} from "@/lib/services/system-health-utils";

export function buildAdminSecurityItem(): HealthCheckItem {
  const adminUser = process.env.ADMIN_BASIC_AUTH_USER?.trim();
  const adminPassword = process.env.ADMIN_BASIC_AUTH_PASSWORD?.trim();
  const enforceStrongPassword = envTrue("ADMIN_ENFORCE_STRONG_CREDENTIALS", true);
  const minimumLength = envInt("ADMIN_MIN_PASSWORD_LENGTH", 14, 10, 64);
  const requireSameOrigin = envTrue("ADMIN_REQUIRE_SAME_ORIGIN", true);
  const forceHttps = envTrue("FORCE_HTTPS", process.env.NODE_ENV === "production");
  const allowlist = process.env.ADMIN_IP_ALLOWLIST?.trim() ?? "";
  const maxFailures = envInt("ADMIN_AUTH_RATE_LIMIT_MAX_FAILURES", 20, 5, 200);
  const windowMs = envInt("ADMIN_AUTH_RATE_LIMIT_WINDOW_MS", 10 * 60 * 1000, 60_000, 60 * 60 * 1000);

  const hasCredentials = Boolean(adminUser && adminPassword);
  const strongEnough =
    !enforceStrongPassword || (adminPassword ? isStrongPassword(adminPassword, minimumLength) : false);

  let level: "ok" | "warn" | "critical" = "ok";
  if (!hasCredentials || !strongEnough) {
    level = "critical";
  } else if (!requireSameOrigin || !forceHttps || !allowlist) {
    level = "warn";
  }

  return {
    key: "admin-security",
    title: "\uAD00\uB9AC\uC790 \uBCF4\uC548",
    level,
    summary:
      level === "critical"
        ? "\uAD00\uB9AC\uC790 \uC778\uC99D \uC124\uC815 \uB610\uB294 \uBE44\uBC00\uBC88\uD638 \uAC15\uB3C4\uAC00 \uC6B4\uC601 \uAE30\uC900\uC744 \uB9CC\uC871\uD558\uC9C0 \uBABB\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4."
        : level === "warn"
          ? "\uAD00\uB9AC\uC790 \uC778\uC99D\uC740 \uB3D9\uC791\uD558\uC9C0\uB9CC \uBCF4\uC548 \uAC15\uD654 \uD56D\uBAA9\uC774 \uB0A8\uC544 \uC788\uC2B5\uB2C8\uB2E4."
          : "\uAD00\uB9AC\uC790 \uBCF4\uC548 \uC124\uC815\uC774 \uC815\uC0C1 \uC0C1\uD0DC\uC785\uB2C8\uB2E4.",
    details: [
      `\uAD00\uB9AC\uC790 \uACC4\uC815: ${mask(adminUser)}`,
      `\uAC15\uD55C \uBE44\uBC00\uBC88\uD638 \uAC15\uC81C: ${boolLabel(enforceStrongPassword)}`,
      `\uCD5C\uC18C \uBE44\uBC00\uBC88\uD638 \uAE38\uC774: ${minimumLength}`,
      `\uC778\uC99D \uC2E4\uD328 \uC81C\uD55C: ${maxFailures}\uD68C / ${Math.round(windowMs / 1000)}\uCD08`,
      `Same-Origin \uAC80\uC99D: ${boolLabel(requireSameOrigin)}`,
      `HTTPS \uAC15\uC81C: ${boolLabel(forceHttps)}`,
      `IP \uD5C8\uC6A9 \uBAA9\uB85D: ${allowlist ? "\uC124\uC815\uB428" : "\uBBF8\uC124\uC815"}`
    ]
  };
}

export async function buildPublicIntakeSecurityItem(): Promise<HealthCheckItem> {
  const requireSameOrigin = envTrue("PUBLIC_INTAKE_REQUIRE_SAME_ORIGIN", true);
  const allowMissingOrigin = envTrue("PUBLIC_INTAKE_ALLOW_MISSING_ORIGIN", false);
  const allowedOrigins = process.env.PUBLIC_INTAKE_ALLOWED_ORIGINS?.trim() ?? "";
  const maxBodyBytes = envInt("PUBLIC_INTAKE_MAX_BODY_BYTES", 64 * 1024, 8 * 1024, 512 * 1024);
  const rateLimitMax = envInt("PUBLIC_INTAKE_RATE_LIMIT_MAX_REQUESTS", 25, 5, 200);
  const dedupWindowMs = envInt("PUBLIC_INTAKE_DEDUP_WINDOW_MS", 120_000, 10_000, 3_600_000);
  const honeypotEnabled = envTrue("PUBLIC_INTAKE_ENABLE_HONEYPOT", true);
  const intakeControl = await getPublicIntakeControlSnapshot();
  const maintenanceMode = intakeControl.maintenanceMode;

  let level: "ok" | "warn" | "critical" = "ok";
  if (!requireSameOrigin || allowMissingOrigin || !honeypotEnabled || maintenanceMode) {
    level = "warn";
  }

  return {
    key: "public-intake-security",
    title: "\uACF5\uAC1C \uC811\uC218 \uBCF4\uC548",
    level,
    summary:
      level === "ok"
        ? "\uACF5\uAC1C \uC811\uC218 API \uBCF4\uC548 \uAE30\uC900\uC774 \uC815\uC0C1 \uC0C1\uD0DC\uC785\uB2C8\uB2E4."
        : "\uACF5\uAC1C \uC811\uC218 \uBCF4\uC548 \uC124\uC815\uC744 \uD55C \uBC88 \uB354 \uC810\uAC80\uD558\uB294 \uAC83\uC744 \uAD8C\uC7A5\uD569\uB2C8\uB2E4.",
    details: [
      `Same-Origin \uAC80\uC99D: ${boolLabel(requireSameOrigin)}`,
      `Origin \uB204\uB77D \uD5C8\uC6A9: ${boolLabel(allowMissingOrigin)}`,
      `\uCD94\uAC00 \uD5C8\uC6A9 \uCD9C\uCC98: ${allowedOrigins || "\uBBF8\uC124\uC815(\uB3D9\uC77C \uD638\uC2A4\uD2B8\uB9CC \uD5C8\uC6A9)"}`,
      `\uCD5C\uB300 \uBCF8\uBB38 \uD06C\uAE30: ${maxBodyBytes} bytes`,
      `\uC694\uCCAD \uC81C\uD55C: ${rateLimitMax}\uD68C / \uC708\uB3C4\uC6B0`,
      `\uC911\uBCF5 \uC811\uC218 \uC708\uB3C4\uC6B0: ${Math.round(dedupWindowMs / 1000)}\uCD08`,
      `\uC790\uB3D9\uD654 \uCC28\uB2E8(honeypot): ${boolLabel(honeypotEnabled)}`,
      `\uC810\uAC80 \uBAA8\uB4DC: ${boolLabel(maintenanceMode)} / \uC18C\uC2A4 ${intakeControl.source}`
    ]
  };
}

export async function buildDatabaseItem(): Promise<HealthCheckItem> {
  const provider = process.env.PRISMA_DB_PROVIDER?.trim() || "sqlite";
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const details = [
    `DB Provider: ${provider}`,
    `DATABASE_URL: ${databaseUrl ? "\uC124\uC815\uB428" : "\uBBF8\uC124\uC815"}`
  ];

  if (!databaseUrl) {
    return {
      key: "database",
      title: "\uB370\uC774\uD130\uBCA0\uC774\uC2A4 \uC5F0\uACB0",
      level: "critical",
      summary: "DATABASE_URL\uC774 \uC5C6\uC5B4 DB \uC5F0\uACB0\uC774 \uBD88\uAC00\uB2A5\uD569\uB2C8\uB2E4.",
      details
    };
  }

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    return {
      key: "database",
      title: "\uB370\uC774\uD130\uBCA0\uC774\uC2A4 \uC5F0\uACB0",
      level: "ok",
      summary: "\uB370\uC774\uD130\uBCA0\uC774\uC2A4 \uC5F0\uACB0 \uC0C1\uD0DC\uAC00 \uC815\uC0C1\uC785\uB2C8\uB2E4.",
      details
    };
  } catch (error) {
    return {
      key: "database",
      title: "\uB370\uC774\uD130\uBCA0\uC774\uC2A4 \uC5F0\uACB0",
      level: "critical",
      summary: "\uB370\uC774\uD130\uBCA0\uC774\uC2A4 \uC5F0\uACB0 \uD14C\uC2A4\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
      details: [...details, `\uC624\uB958: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}

export function buildLawbotItem(): HealthCheckItem {
  const url = process.env.LAWBOT_ANALYZE_URL?.trim();
  const token = process.env.LAWBOT_ANALYZE_TOKEN?.trim();
  const timeoutMs = envInt("LAWBOT_ANALYZE_TIMEOUT_MS", 8000, 1000, 60_000);
  const level: "ok" | "warn" | "critical" = url && token ? "ok" : "warn";

  return {
    key: "lawbot",
    title: "Lawbot \uC5F0\uB3D9",
    level,
    summary:
      level === "ok"
        ? "Lawbot \uBD84\uC11D \uD638\uCD9C \uC900\uBE44\uAC00 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
        : "Lawbot \uC5F0\uACB0 \uC124\uC815\uC774 \uBD80\uC871\uD558\uAC70\uB098 \uBE44\uD65C\uC131 \uC0C1\uD0DC\uC785\uB2C8\uB2E4.",
    details: [
      `\uBD84\uC11D URL: ${url ? "\uC124\uC815\uB428" : "\uBBF8\uC124\uC815"}`,
      `\uBD84\uC11D \uD1A0\uD070: ${token ? "\uC124\uC815\uB428" : "\uBBF8\uC124\uC815"}`,
      `\uC694\uCCAD \uD0C0\uC784\uC544\uC6C3: ${timeoutMs}ms`
    ]
  };
}

export function buildNotionItem(): HealthCheckItem {
  const enabled = envTrue("NOTION_SYNC_ENABLED", false);
  const notionToken = process.env.NOTION_TOKEN?.trim();
  const consultationDb = process.env.NOTION_CONSULTATION_DATABASE_ID?.trim();
  const caseDb = process.env.NOTION_CASE_DATABASE_ID?.trim();
  const configured = Boolean(notionToken && consultationDb);

  const level: "ok" | "warn" | "critical" = enabled ? (configured ? "ok" : "warn") : "ok";
  return {
    key: "notion",
    title: "Notion \uB3D9\uAE30\uD654",
    level,
    summary:
      enabled && configured
        ? "Notion \uB3D9\uAE30\uD654\uAC00 \uC815\uC0C1 \uAD6C\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
        : enabled
          ? "Notion \uB3D9\uAE30\uD654 \uC124\uC815 \uC77C\uBD80\uAC00 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4."
          : "Notion \uB3D9\uAE30\uD654\uB294 \uBE44\uD65C\uC131 \uC0C1\uD0DC\uC785\uB2C8\uB2E4.",
    details: [
      `\uB3D9\uAE30\uD654 \uC0AC\uC6A9: ${boolLabel(enabled)}`,
      `Notion \uD1A0\uD070: ${notionToken ? "\uC124\uC815\uB428" : "\uBBF8\uC124\uC815"}`,
      `\uC0C1\uB2F4 DB: ${consultationDb ? "\uC124\uC815\uB428" : "\uBBF8\uC124\uC815"}`,
      `\uC0AC\uAC74 DB: ${caseDb ? "\uC124\uC815\uB428" : "\uBBF8\uC124\uC815"}`
    ]
  };
}

export async function buildStorageItem(): Promise<HealthCheckItem> {
  const provider = process.env.PRISMA_DB_PROVIDER?.trim() || "sqlite";
  const databaseUrl = process.env.DATABASE_URL?.trim() || "";
  const marketingPath =
    process.env.AUTOPOST_MARKETING_PAYLOAD_PATH?.trim() ||
    path.join(process.cwd(), "data", "marketing-sync-latest.json");

  const details = [
    `\uC800\uC7A5\uC18C \uAE30\uC900: ${provider}`,
    `\uB9C8\uCF00\uD305 \uC2A4\uB0C5\uC0F7 \uACBD\uB85C: ${marketingPath}`
  ];

  try {
    await mkdir(path.dirname(marketingPath), { recursive: true });
    await access(path.dirname(marketingPath));
  } catch (error) {
    return {
      key: "storage",
      title: "\uC800\uC7A5\uC18C/\uBC31\uC5C5 \uACBD\uB85C",
      level: "warn",
      summary: "\uBC31\uC5C5 \uACBD\uB85C \uC811\uADFC\uC5D0 \uBB38\uC81C\uAC00 \uC788\uC2B5\uB2C8\uB2E4.",
      details: [...details, `\uC624\uB958: ${error instanceof Error ? error.message : String(error)}`]
    };
  }

  const sqliteOnOneDrive = provider === "sqlite" && databaseUrl.toLowerCase().includes("onedrive");
  if (sqliteOnOneDrive) {
    return {
      key: "storage",
      title: "\uC800\uC7A5\uC18C/\uBC31\uC5C5 \uACBD\uB85C",
      level: "warn",
      summary:
        "OneDrive \uAE30\uBC18 SQLite\uB294 \uD30C\uC77C \uC7A0\uAE08 \uCDA9\uB3CC \uC704\uD5D8\uC774 \uC788\uC5B4 \uC6B4\uC601 DB\uB85C \uAD8C\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
      details: [...details, "\uAD8C\uC7A5: Railway Postgres + PITR \uBC31\uC5C5"]
    };
  }

  return {
    key: "storage",
    title: "\uC800\uC7A5\uC18C/\uBC31\uC5C5 \uACBD\uB85C",
    level: "ok",
    summary: "\uBC31\uC5C5 \uACBD\uB85C \uC811\uADFC \uC0C1\uD0DC\uAC00 \uC815\uC0C1\uC785\uB2C8\uB2E4.",
    details
  };
}

export function buildRecommendedActions(items: HealthCheckItem[]) {
  const actions: string[] = [];

  for (const item of items) {
    if (item.key === "admin-security" && item.level !== "ok") {
      actions.push(
        "\uAD00\uB9AC\uC790 \uC778\uC99D \uACC4\uC815, \uBE44\uBC00\uBC88\uD638 \uAC15\uB3C4, IP \uD5C8\uC6A9 \uBAA9\uB85D \uC124\uC815\uC744 \uC6B4\uC601 \uAE30\uC900\uC73C\uB85C \uC7AC\uC810\uAC80\uD558\uC138\uC694."
      );
    }
    if (item.key === "public-intake-security" && item.level !== "ok") {
      actions.push(
        "\uACF5\uAC1C \uC811\uC218 API\uC758 Same-Origin, \uC810\uAC80 \uBAA8\uB4DC, honeypot \uC124\uC815\uC744 \uD655\uC778\uD558\uC138\uC694."
      );
    }
    if (item.key === "database" && item.level === "critical") {
      actions.push("DATABASE_URL \uBC0F Railway \uC5F0\uACB0 \uC0C1\uD0DC\uB97C \uC6B0\uC120 \uBCF5\uAD6C\uD558\uC138\uC694.");
    }
    if (item.key === "lawbot" && item.level !== "ok") {
      actions.push("Lawbot URL/\uD1A0\uD070 \uC124\uC815\uC744 \uC644\uB8CC\uD558\uACE0 \uC0AC\uAC74 \uC0C1\uC138 \uC7AC\uBD84\uC11D\uC73C\uB85C \uC5F0\uACB0 \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uC138\uC694.");
    }
    if (item.key === "notion" && item.level !== "ok") {
      actions.push("Notion \uB3D9\uAE30\uD654\uB97C \uC0AC\uC6A9\uD560 \uACC4\uD68D\uC774\uBA74 \uD1A0\uD070\uACFC \uB370\uC774\uD130\uBCA0\uC774\uC2A4 ID\uB97C \uBAA8\uB450 \uC124\uC815\uD558\uC138\uC694.");
    }
    if (item.key === "storage" && item.level !== "ok") {
      actions.push("Railway Postgres + PITR \uBC31\uC5C5 \uC0C1\uD0DC\uB97C \uC6B4\uC601 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8\uB85C \uACE0\uC815\uD558\uC138\uC694.");
    }
  }

  if (actions.length === 0) {
    actions.push("\uD604\uC7AC \uC0C1\uD0DC\uB294 \uC548\uC815\uC801\uC785\uB2C8\uB2E4. \uC8FC 1\uD68C \uBAA8\uB2C8\uD130\uB9C1 \uC810\uAC80\uC744 \uC720\uC9C0\uD558\uC138\uC694.");
  }

  return actions;
}
