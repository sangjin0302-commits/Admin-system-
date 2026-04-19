#!/usr/bin/env node

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function statusIn(status, allowed) {
  return allowed.includes(status);
}

export async function runSmokeRuntime({
  baseUrl,
  strictProduction,
  allowSkip,
  requestTimeoutMs,
  adminUser,
  adminPassword,
  marketingSyncToken,
  logger = console
}) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const hasAdminCredentials = Boolean(adminUser && adminPassword);
  const adminAuthHeader = hasAdminCredentials
    ? `Basic ${Buffer.from(`${adminUser}:${adminPassword}`).toString("base64")}`
    : "";

  async function request(pathname, init = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      return await fetch(`${normalizedBaseUrl}${pathname}`, {
        redirect: "follow",
        ...init,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function checkServerReachable() {
    try {
      const response = await request("/intake");
      return response.status < 500;
    } catch {
      return false;
    }
  }

  logger.log(`[smoke] start target=${normalizedBaseUrl}`);
  const reachable = await checkServerReachable();
  if (!reachable) {
    const message = `[smoke] Target is unreachable: ${normalizedBaseUrl}. Start server first or set SMOKE_BASE_URL to a live deployment URL.`;
    if (allowSkip) {
      logger.log(`${message} (skipped)`);
      return;
    }
    throw new Error(message);
  }

  const intake = await request("/intake");
  assert(intake.status === 200, `Expected /intake status 200, got ${intake.status}`);
  logger.log("[smoke] intake check ok");

  const protectedPages = ["/admin", "/admin/inquiries", "/admin/monitoring"];
  const protectedApis = ["/api/admin/system/health", "/api/admin/marketing/overview"];

  const adminAllowed = strictProduction
    ? hasAdminCredentials
      ? [401]
      : [503]
    : hasAdminCredentials
      ? [401, 200]
      : [503, 200];

  for (const path of protectedPages) {
    const response = await request(path);
    assert(
      statusIn(response.status, adminAllowed),
      `Unexpected ${path} unauth status ${response.status}. Allowed: ${adminAllowed.join(", ")}`
    );
  }
  logger.log("[smoke] unauth protected page check ok");

  const adminApiAllowed = strictProduction
    ? hasAdminCredentials
      ? [401]
      : [503]
    : hasAdminCredentials
      ? [401, 200]
      : [503, 200];

  for (const path of protectedApis) {
    const response = await request(path);
    assert(
      statusIn(response.status, adminApiAllowed),
      `Unexpected ${path} unauth status ${response.status}. Allowed: ${adminApiAllowed.join(", ")}`
    );
  }
  logger.log("[smoke] unauth protected api check ok");

  if (hasAdminCredentials) {
    for (const path of protectedPages) {
      const response = await request(path, {
        headers: { Authorization: adminAuthHeader }
      });
      assert(response.status === 200, `Expected ${path} auth status 200, got ${response.status}`);
    }

    for (const path of protectedApis) {
      const response = await request(path, {
        headers: { Authorization: adminAuthHeader }
      });
      assert(response.status === 200, `Expected ${path} auth status 200, got ${response.status}`);
    }
    logger.log("[smoke] auth protected route check ok");
  }

  const marketingInvalid = await request("/api/admin/marketing/ingest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-sync-token": "invalid-token"
    },
    body: JSON.stringify({ source: "smoke", summary: { ok: true } })
  });
  assert(marketingInvalid.status >= 400, "Expected invalid marketing token request to fail.");
  logger.log("[smoke] invalid ingest token check ok");

  if (marketingSyncToken) {
    const marketingValid = await request("/api/admin/marketing/ingest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-sync-token": marketingSyncToken
      },
      body: JSON.stringify({ source: "smoke", summary: { ok: true } })
    });
    assert(
      marketingValid.status === 201,
      `Expected valid marketing ingest status 201, got ${marketingValid.status}`
    );
    logger.log("[smoke] valid ingest token check ok");
  }

  logger.log(`[smoke] PASS on ${normalizedBaseUrl}`);
}
