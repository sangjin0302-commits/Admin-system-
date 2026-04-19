import type { HealthCheckItem } from "@/lib/services/system-health-types";
import { boolLabel, envInt, envTrue } from "@/lib/services/system-health-utils";

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
