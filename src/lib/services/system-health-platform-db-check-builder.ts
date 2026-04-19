import { prisma } from "@/lib/prisma/client";
import type { HealthCheckItem } from "@/lib/services/system-health-types";

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
