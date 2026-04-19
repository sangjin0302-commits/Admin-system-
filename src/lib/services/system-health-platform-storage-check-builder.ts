import { access, mkdir } from "node:fs/promises";
import path from "node:path";

import type { HealthCheckItem } from "@/lib/services/system-health-types";

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
