import type { HealthCheckItem, HealthLevel } from "@/lib/services/system-health-types";

export function envTrue(name: string, defaultValue = false) {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

export function envInt(name: string, defaultValue: number, min: number, max: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return defaultValue;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(max, Math.max(min, parsed));
}

export function mask(value: string | undefined) {
  if (!value) return "\uBBF8\uC124\uC815";
  if (value.length <= 4) return "\uC124\uC815\uB428";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

export function boolLabel(value: boolean) {
  return value ? "\uC0AC\uC6A9" : "\uBBF8\uC0AC\uC6A9";
}

export function getScoreByLevel(level: HealthLevel) {
  if (level === "ok") return 100;
  if (level === "warn") return 70;
  return 25;
}

export function summarizeOverallLevel(items: HealthCheckItem[]): HealthLevel {
  if (items.some((item) => item.level === "critical")) return "critical";
  if (items.some((item) => item.level === "warn")) return "warn";
  return "ok";
}

export function isStrongPassword(password: string, minimumLength: number) {
  if (password.length < minimumLength) return false;

  let groups = 0;
  if (/[A-Z]/.test(password)) groups += 1;
  if (/[a-z]/.test(password)) groups += 1;
  if (/\d/.test(password)) groups += 1;
  if (/[^A-Za-z0-9]/.test(password)) groups += 1;

  return groups >= 3;
}
