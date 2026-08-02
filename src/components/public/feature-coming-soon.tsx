import Link from "next/link";

/**
 * 기능 플래그로 잠긴 공개 페이지의 "준비 중" 폴백.
 * 상담으로 자연스럽게 유도한다. (voice-consult 폴백과 동일 톤)
 */
export function FeatureComingSoon({
  title = "준비 중입니다",
  body = "이 기능은 현재 준비 중입니다. 아래에서 문의해 주세요.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-serif text-2xl font-bold text-primary">{title}</h1>
      <p className="mt-3 text-sm text-text-muted">{body}</p>
      <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Link
          href="/intake"
          className="inline-block rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-text-strong"
        >
          상담 신청
        </Link>
        <Link
          href="/blog"
          className="inline-block rounded-md border border-primary/40 px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"
        >
          법률 칼럼 보기
        </Link>
      </div>
    </div>
  );
}
