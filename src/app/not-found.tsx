import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">404 · Not Found</p>
      <h1 className="mt-4 font-serif text-6xl font-bold text-primary sm:text-8xl">404</h1>
      <div className="mt-4 flex items-center justify-center gap-3">
        <span className="h-px w-12 bg-gold" />
        <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
        <span className="h-px w-12 bg-gold" />
      </div>
      <h2 className="mt-6 font-serif text-2xl font-bold text-primary">
        길을 찾지 못했습니다
      </h2>
      <p className="mt-3 text-sm leading-7 text-text-muted">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        <br />
        절차에는 이성을 — 정확한 길로 안내드리겠습니다.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-lg bg-primary px-6 font-serif text-sm font-bold text-white hover:bg-text-strong"
        >
          홈으로
        </Link>
        <Link
          href="/services"
          className="inline-flex h-12 items-center rounded-lg border-2 border-gold/40 bg-surface px-6 font-serif text-sm font-semibold text-primary hover:bg-gold-soft/30"
        >
          업무 분야
        </Link>
        <Link
          href="/intake"
          className="inline-flex h-12 items-center rounded-lg border-2 border-gold/40 bg-surface px-6 font-serif text-sm font-semibold text-primary hover:bg-gold-soft/30"
        >
          상담 신청
        </Link>
      </div>
    </div>
  );
}
