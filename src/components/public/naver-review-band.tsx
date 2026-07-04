import { getNaverReviewSummary } from "@/lib/services/naver-review-service";

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const stars: string[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push("★");
    else if (i === full && hasHalf) stars.push("☆");
    else stars.push("☆");
  }
  return (
    <span className="text-lg text-[#03C75A]" aria-label={`${rating} / 5`}>
      {stars.join(" ")}
    </span>
  );
}

export async function NaverReviewBand() {
  const { reviews, count, avgRating, placeUrl } = await getNaverReviewSummary();
  if (count === 0) return null;

  const preview = reviews.slice(0, 5);

  return (
    <section className="ethos-band ethos-band-soft py-16 sm:py-20" aria-labelledby="naver-review-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#03C75A] font-serif text-lg font-bold text-white"
            >
              N
            </span>
            <div>
              <p className="ethos-eyebrow">Naver Place · 실제 방문자 후기</p>
              <h2 id="naver-review-heading" className="mt-1 flex items-center gap-2 font-serif text-xl font-bold text-primary">
                <Stars rating={avgRating} />
                <span className="text-base">
                  {avgRating.toFixed(1)} <span className="text-text-muted">({count}개 리뷰)</span>
                </span>
              </h2>
            </div>
          </div>
          {placeUrl && (
            <a
              href={placeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#03C75A]/60 bg-white px-5 text-sm font-semibold text-[#03C75A] transition hover:bg-[#03C75A]/10"
            >
              네이버에서 모든 후기 보기 →
            </a>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((r, idx) => (
            <article key={idx} className="ethos-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-strong">{r.author}</p>
                <Stars rating={r.rating} />
              </div>
              <p className="mt-3 line-clamp-4 text-sm leading-6 text-text-muted">{r.text}</p>
              {r.date && <p className="mt-3 text-xs text-text-muted">{r.date}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
