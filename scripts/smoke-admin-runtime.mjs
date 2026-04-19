#!/usr/bin/env node

import { runSmokeRuntime } from "./smoke-admin-runtime-core.mjs";

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
const strictProduction = process.env.SMOKE_STRICT_PRODUCTION === "1";
const allowSkip = process.env.SMOKE_ALLOW_SKIP === "1";
const requestTimeoutMs = Number(process.env.SMOKE_REQUEST_TIMEOUT_MS || "10000");

const adminUser = process.env.ADMIN_BASIC_AUTH_USER?.trim() ?? "";
const adminPassword = process.env.ADMIN_BASIC_AUTH_PASSWORD?.trim() ?? "";
const marketingSyncToken = process.env.ADMIN_MARKETING_SYNC_TOKEN?.trim() ?? "";

runSmokeRuntime({
  baseUrl,
  strictProduction,
  allowSkip,
  requestTimeoutMs,
  adminUser,
  adminPassword,
  marketingSyncToken
}).catch((error) => {
  console.error("[smoke] FAIL:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
