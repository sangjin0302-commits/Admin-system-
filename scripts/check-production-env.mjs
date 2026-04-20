#!/usr/bin/env node

function getEnv(name) {
  return process.env[name]?.trim() ?? "";
}

function asInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function asBool(value) {
  return /^(1|true|yes|on)$/i.test(value ?? "");
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
const lawbotAutomaticCalls = asBool(getEnv("LAWBOT_ENABLE_AUTOMATIC_CALLS"));
const lawbotAnalyzeUrl = getEnv("LAWBOT_ANALYZE_URL");
const lawbotAnalyzeToken = getEnv("LAWBOT_ANALYZE_TOKEN");
const lawbotAnalyzeTimeoutMs = asInt(getEnv("LAWBOT_ANALYZE_TIMEOUT_MS"), 8000);

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
if (lawbotAutomaticCalls && !lawbotAnalyzeUrl) {
  errors.push("LAWBOT_ENABLE_AUTOMATIC_CALLS=true requires LAWBOT_ANALYZE_URL.");
}
if (lawbotAutomaticCalls && !lawbotAnalyzeToken) {
  errors.push("LAWBOT_ENABLE_AUTOMATIC_CALLS=true requires LAWBOT_ANALYZE_TOKEN.");
}
if (lawbotAnalyzeTimeoutMs < 1000 || lawbotAnalyzeTimeoutMs > 60000) {
  errors.push("LAWBOT_ANALYZE_TIMEOUT_MS must be between 1000 and 60000.");
}

if (errors.length > 0) {
  console.error("[env-check] FAIL");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("[env-check] OK: production-required environment variables look valid.");
