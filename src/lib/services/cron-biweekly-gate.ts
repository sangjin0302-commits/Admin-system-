/**
 * bi-weekly 크론 실주기 격주 게이트.
 *
 * 문제: Vercel Cron 스케줄식(cron expression)은 "매 2주"를 표준지원 안 함.
 * 기존 vercel.json 의 `0 22 * * 1` 은 사실 **매주 월요일** 실행 → 이름과 불일치.
 * 해결: 매주 트리거는 유지하되 route.ts 가 홀수 ISO week 는 skip 하도록 게이트.
 *
 * 결과적으로 case-delay/gsc-rank/podcast 는 실제 격주로만 실행.
 */

/**
 * ISO 8601 주차 (1~53).
 * 월요일 시작, 목요일이 속한 주가 그 해의 주.
 */
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7; // Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // 목요일로 이동
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
}

/** 짝수 ISO week 만 true → bi-weekly 실행 허용. */
export function shouldRunBiWeekly(date: Date = new Date()): boolean {
  return isoWeek(date) % 2 === 0;
}
