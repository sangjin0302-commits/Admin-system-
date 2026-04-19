import type { HealthCheckItem } from "@/lib/services/system-health-types";

export function buildRecommendedActions(items: HealthCheckItem[]) {
  const actions: string[] = [];

  for (const item of items) {
    if (item.key === "admin-security" && item.level !== "ok") {
      actions.push(
        "\uAD00\uB9AC\uC790 \uC778\uC99D \uACC4\uC815, \uBE44\uBC00\uBC88\uD638 \uAC15\uB3C4, IP \uD5C8\uC6A9 \uBAA9\uB85D \uC124\uC815\uC744 \uC6B4\uC601 \uAE30\uC900\uC73C\uB85C \uC7AC\uC810\uAC80\uD558\uC138\uC694."
      );
    }
    if (item.key === "admin-runtime-guard" && item.level !== "ok") {
      actions.push(
        "Vercel 운영 환경변수(ADMIN_BASIC_AUTH_USER, ADMIN_BASIC_AUTH_PASSWORD, ADMIN_MARKETING_SYNC_TOKEN)를 재확인해 런타임 보호를 복구하세요."
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
