#!/usr/bin/env node

function getEnv(name) {
  return process.env[name]?.trim() ?? "";
}

function asInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

const targetEnv = (process.env.RUNTIME_ENV || process.env.NODE_ENV || "development").toLowerCase();
const isProduction = targetEnv === "production";

const required = ["ADMIN_BASIC_AUTH_USER", "ADMIN_BASIC_AUTH_PASSWORD", "ADMIN_MARKETING_SYNC_TOKEN"];
const missing = required.filter((name) => !getEnv(name));

const minPasswordLength = asInt(getEnv("ADMIN_MIN_PASSWORD_LENGTH"), 14);
const password = getEnv("ADMIN_BASIC_AUTH_PASSWORD");
const marketingToken = getEnv("ADMIN_MARKETING_SYNC_TOKEN");
const marketingTokenMin = asInt(getEnv("ADMIN_MARKETING_SYNC_TOKEN_MIN_LENGTH"), 24);

const weakPassword = password && password.length < minPasswordLength;
const weakMarketingToken = marketingToken && marketingToken.length < marketingTokenMin;

if (!isProduction) {
  console.log(
    `[env-check] target=${targetEnv}. Production strict mode is skipped. Set RUNTIME_ENV=production to enforce.`
  );
  process.exit(0);
}

const errors = [];
if (missing.length > 0) {
  errors.push(`Missing required env: ${missing.join(", ")}`);
}
if (weakPassword) {
  errors.push(`ADMIN_BASIC_AUTH_PASSWORD must be at least ${minPasswordLength} characters.`);
}
if (weakMarketingToken) {
  errors.push(`ADMIN_MARKETING_SYNC_TOKEN must be at least ${marketingTokenMin} characters.`);
}

if (errors.length > 0) {
  console.error("[env-check] FAIL");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("[env-check] OK: production-required environment variables look valid.");
