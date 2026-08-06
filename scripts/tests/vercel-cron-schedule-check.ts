/**
 * vercel.json 크론 스케줄 잠금.
 *
 * 크론 시간이 되돌아가면(morning-ops 가 KST 저녁이 되거나 backup 이 트래픽 피크로
 * 옮겨지면) 실제 서비스에 티 안나게 손해가 누적됨. 이 잠금은 의도된 KST 타이밍을
 * 코드로 못박아 회귀 시 CI 를 빨갛게 만든다.
 *
 * 실행: npx tsx scripts/tests/vercel-cron-schedule-check.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

type Cron = { path: string; schedule: string };

const raw = readFileSync(resolve(process.cwd(), "vercel.json"), "utf-8");
const cfg = JSON.parse(raw) as { crons: Cron[] };

// UTC → KST(+9) 의도된 스케줄. 위반 시 CI 실패.
// 형식: cron expression (UTC).
const EXPECTED: Record<string, string> = {
  "/api/cron/batch/morning-ops":       "0 21 * * *",   // KST 06:00 매일
  "/api/cron/batch/night-analytics":   "0 22 * * *",   // KST 07:00 매일 (briefing 배송)
  "/api/cron/batch/content-sync":      "0 5 * * *",    // KST 14:00 매일 (네이버 오후1시 발행 후)
  "/api/cron/batch/infra-maintenance": "0 18 * * *",   // KST 03:00 매일 (트래픽 최저)
  "/api/cron/batch/calendar-sync":     "0 6 * * *",    // KST 15:00 매일
  "/api/cron/batch/weekly-batch":      "0 12 * * 0",   // KST 일 21:00
  "/api/cron/batch/monthly-batch":     "0 1 1 * *",    // KST 매월1일 10:00
  "/api/cron/batch/bi-weekly":         "0 22 * * 1",   // KST 화 07:00 (route에서 격주 gate)
};

const actual = new Map(cfg.crons.map((c) => [c.path, c.schedule]));

for (const [path, expected] of Object.entries(EXPECTED)) {
  const got = actual.get(path);
  assert.equal(
    got,
    expected,
    `크론 스케줄 회귀: ${path} 예상 "${expected}" 실제 "${got ?? "(없음)"}"`,
  );
}

// 예상에 없는 크론이 들어오면 검토 강제 (스케줄 잠금 갱신).
for (const c of cfg.crons) {
  assert.ok(
    EXPECTED[c.path] !== undefined,
    `잠금 미등록 크론: ${c.path} — scripts/tests/vercel-cron-schedule-check.ts 의 EXPECTED 갱신 필요`,
  );
}

console.log(`vercel cron schedule lock: ${cfg.crons.length}/${Object.keys(EXPECTED).length} 통과`);
