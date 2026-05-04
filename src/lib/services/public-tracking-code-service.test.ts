import assert from "node:assert/strict";

import {
  buildPublicTrackingCommunicationLogEntry,
  extractPublicTrackingCodeFromCommunicationLogs,
  generatePublicTrackingCheckCode,
  generatePublicTrackingCode,
  getKoreaMonthRange,
  getPublicTrackingCategoryCode
} from "@/lib/services/public-tracking-code-service";
import type { IntakeCategory } from "@/types/intake-category";

const categoryCodes: Record<IntakeCategory, string> = {
  visa: "VI",
  corporation: "CO",
  administrative_appeal: "AP",
  fact_finding_contract: "FC",
  permit_license: "PL",
  arabic_translation: "AR",
  civil_petition: "CP"
};

for (const [category, code] of Object.entries(categoryCodes) as [IntakeCategory, string][]) {
  assert.equal(getPublicTrackingCategoryCode(category), code);
}

const createdAt = new Date("2026-04-27T03:00:00.000Z");
assert.equal(
  generatePublicTrackingCode({
    category: "visa",
    createdAt,
    monthlySequence: 7,
    checkCode: "K3"
  }),
  "20260427-VI-0007-K3"
);
assert.equal(
  generatePublicTrackingCode({
    category: "arabic_translation",
    createdAt,
    monthlySequence: 14,
    checkCode: "Q8"
  }),
  "20260427-AR-0014-Q8"
);
assert.equal(
  generatePublicTrackingCode({
    category: "civil_petition",
    createdAt,
    monthlySequence: 22,
    checkCode: "M5"
  }),
  "20260427-CP-0022-M5"
);

assert.match(
  generatePublicTrackingCode({
    category: "permit_license",
    createdAt,
    monthlySequence: 1,
    checkCode: "A2"
  }),
  /^[0-9]{8}-PL-[0-9]{4}-[A-Z2-9]{2,6}$/
);

assert.throws(() =>
  generatePublicTrackingCode({
    category: "visa",
    createdAt,
    monthlySequence: 0,
    checkCode: "K3"
  })
);
assert.throws(() =>
  generatePublicTrackingCode({
    category: "visa",
    createdAt,
    monthlySequence: 1,
    checkCode: "O1"
  })
);

for (let index = 0; index < 25; index += 1) {
  const checkCode = generatePublicTrackingCheckCode();
  assert.match(checkCode, /^[A-HJ-NP-Z2-9]{2,}$/);
  assert.equal(/[O0I1]/.test(checkCode), false);
}

const koreaMonthRange = getKoreaMonthRange(new Date("2026-04-15T16:00:00.000Z"));
assert.equal(koreaMonthRange.start.toISOString(), "2026-03-31T15:00:00.000Z");
assert.equal(koreaMonthRange.end.toISOString(), "2026-04-30T15:00:00.000Z");

const logEntry = buildPublicTrackingCommunicationLogEntry("20260427-VI-0007-K3", createdAt);
assert.equal(logEntry.channel, "INTERNAL");
assert.equal(logEntry.responsePending, false);
assert.equal(
  extractPublicTrackingCodeFromCommunicationLogs(JSON.stringify([logEntry])),
  "20260427-VI-0007-K3"
);
assert.equal(extractPublicTrackingCodeFromCommunicationLogs("[]"), null);

// The first implementation uses count + 1 for the monthly sequence and a random check code.
// A future dedicated DB column should add a unique index for stronger concurrent lookup guarantees.
