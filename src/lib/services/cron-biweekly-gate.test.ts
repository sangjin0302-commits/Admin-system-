import assert from "node:assert/strict";
import { isoWeek, shouldRunBiWeekly } from "@/lib/services/cron-biweekly-gate";

// ── isoWeek: 확정 스팟체크 ─────────────────────────────
// 2026-01-05 (월요일) = ISO week 2 of 2026
assert.equal(isoWeek(new Date("2026-01-05T00:00:00Z")), 2);
// 2026-01-01 (목요일) = ISO week 1
assert.equal(isoWeek(new Date("2026-01-01T00:00:00Z")), 1);
// 2026-12-28 (월요일) = ISO week 53 (2026 has 53 weeks)
assert.equal(isoWeek(new Date("2026-12-28T00:00:00Z")), 53);
// 2027-01-04 (월요일) = ISO week 1 of 2027
assert.equal(isoWeek(new Date("2027-01-04T00:00:00Z")), 1);

// ── shouldRunBiWeekly: 격주 게이트 ────────────────────
// week 1 = odd → skip
assert.equal(shouldRunBiWeekly(new Date("2026-01-01T00:00:00Z")), false);
// week 2 = even → run
assert.equal(shouldRunBiWeekly(new Date("2026-01-05T00:00:00Z")), true);
// week 3 = odd → skip
assert.equal(shouldRunBiWeekly(new Date("2026-01-12T00:00:00Z")), false);
// week 4 = even → run
assert.equal(shouldRunBiWeekly(new Date("2026-01-19T00:00:00Z")), true);

console.log("cron biweekly gate tests passed");
