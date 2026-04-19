import { getPublicIntakeControlSnapshot } from "@/lib/services/public-intake-control-service-safe-v3";
import type { HealthCheckItem } from "@/lib/services/system-health-types";
import {
  boolLabel,
  envInt,
  envTrue,
  isStrongPassword,
  mask
} from "@/lib/services/system-health-utils";
export { buildAdminRuntimeGuardItem } from "@/lib/services/system-health-admin-runtime-guard-builder";

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
