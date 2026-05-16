import assert from "node:assert/strict";

import { sanitizeSystemHealthPayloadForResponse } from "./route-safe-v2";

const forbidden = [
  "DATABASE_URL",
  "ADMIN_BASIC_AUTH_PASSWORD",
  "ADMIN_BASIC_AUTH_USER",
  "RESEND_API_KEY",
  "EMAIL_FROM"
];

const sanitized = sanitizeSystemHealthPayloadForResponse({
  ok: true,
  snapshot: {
    items: [
      {
        key: "database",
        details: ["DATABASE_URL: configured"],
        summary: "DATABASE_URL is missing"
      },
      {
        key: "admin-runtime-guard",
        details: ["ADMIN_BASIC_AUTH_USER: qa", "ADMIN_BASIC_AUTH_PASSWORD: configured"]
      },
      {
        key: "email",
        details: ["RESEND_API_KEY: configured", "EMAIL_FROM: notice@example.test"]
      }
    ],
    recommendedActions: ["Check DATABASE_URL and ADMIN_BASIC_AUTH_PASSWORD."]
  }
});

const serialized = JSON.stringify(sanitized);

for (const token of forbidden) {
  assert.equal(serialized.includes(token), false, `${token} should not be exposed in health response`);
}

assert.equal(serialized.includes("database connection setting"), true);
assert.equal(serialized.includes("admin auth credential"), true);
assert.equal(serialized.includes("email provider credential"), true);
assert.equal(serialized.includes("email sender setting"), true);

console.log("system health response sanitizer tests passed");
