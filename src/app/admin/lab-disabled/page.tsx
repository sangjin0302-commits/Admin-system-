import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * 실험 페이지 하드 차단 안내.
 *
 * 미들웨어가 실험 경로(experimental-admin-pages.ts)를 이 페이지로 rewrite 한다.
 * 이 경로에서는 원래 페이지의 서버 코드가 아예 실행되지 않는다 — DB 조회도,
 * 외부 API 호출도 발생하지 않는다.
 *
 * 되살리는 방법은 두 단계다:
 *   1) 환경변수 ADMIN_ENABLE_EXPERIMENTAL=true  (하드 차단 해제)
 *   2) /admin/features 에서 "실험실 페이지 활성화" ON (표시 게이트 해제)
 */
export default function LabDisabledPage() {
  return (
    <section className="admin-card-static">
      <p className="ui-kicker">실험실</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">
        차단된 실험 기능입니다
      </h2>
      <p className="mt-2 max-w-prose text-sm text-text-muted">
        요청하신 페이지는 실험·데모 성격이라 기본적으로 차단돼 있습니다. 페이지와
        데이터는 그대로 보존되며, 차단 상태에서는 해당 페이지의 코드가 실행되지 않습니다.
      </p>

      <div className="mt-5 rounded-lg border border-line bg-surface-muted p-4">
        <p className="text-xs font-semibold text-text-strong">다시 켜려면</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-6 text-text-muted">
          <li>
            환경변수 <code className="rounded bg-surface px-1 font-mono">ADMIN_ENABLE_EXPERIMENTAL=true</code> 설정 후 재배포
          </li>
          <li>
            <Link href="/admin/features" className="font-medium text-primary underline underline-offset-2">
              기능 설정
            </Link>
            에서 &ldquo;실험실 페이지 활성화&rdquo; 켜기
          </li>
        </ol>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-line-strong hover:bg-surface-muted"
        >
          대시보드로 돌아가기
        </Link>
        <Link
          href="/admin/features"
          className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-line-strong hover:bg-surface-muted"
        >
          기능 설정 열기
        </Link>
      </div>
    </section>
  );
}
