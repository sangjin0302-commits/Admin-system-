import Link from "next/link";

export const metadata = {
  title: "B2B 기업 비자 처리 · ETHOS",
  description: "기업 인사팀 전용 대량 비자 처리 서비스",
};

export default function B2BLandingPage() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="ui-kicker">Enterprise</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-primary sm:text-5xl">
          기업 인사팀 전용
          <br />
          대량 비자 처리 서비스
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-text-muted">
          외국인 임직원 채용부터 체류 관리까지 — 전담 관리자가 볼륨 단위로 처리합니다.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/b2b/inquiry"
            className="rounded-lg bg-primary px-6 py-3 font-bold text-white"
          >
            B2B 상담 신청
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-primary">주요 혜택</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          <li className="rounded-xl border border-line bg-surface p-5">
            <h3 className="font-bold text-text-strong">전담 관리자</h3>
            <p className="mt-2 text-sm text-text-muted">
              단일 채널로 접수·회신하는 담당 파트너가 배정됩니다.
            </p>
          </li>
          <li className="rounded-xl border border-line bg-surface p-5">
            <h3 className="font-bold text-text-strong">볼륨 할인</h3>
            <p className="mt-2 text-sm text-text-muted">
              월 처리 건수에 따라 최대 30% 할인이 적용됩니다.
            </p>
          </li>
          <li className="rounded-xl border border-line bg-surface p-5">
            <h3 className="font-bold text-text-strong">전용 대시보드</h3>
            <p className="mt-2 text-sm text-text-muted">
              전 건의 상태·기한을 인사팀이 실시간으로 조회합니다.
            </p>
          </li>
        </ul>
      </section>
    </main>
  );
}
