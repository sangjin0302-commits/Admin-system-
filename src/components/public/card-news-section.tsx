import Image from "next/image";
import { parseCardNews, splitCardNews } from "@/lib/services/card-news";

/**
 * 카드뉴스 섹션 — 블로그 글 맨 끝에만 렌더. 첫 슬라이드는 커버(표지)로 크게,
 * 나머지는 카드 그리드로. 리모트 이미지는 next/image 최적화 부담을 피해 unoptimized.
 */
export function CardNewsSection({ raw, lang }: { raw: unknown; lang: "ko" | "en" }) {
  const slides = parseCardNews(raw);
  if (slides.length === 0) return null;
  const { cover, rest } = splitCardNews(slides);

  const isRemote = (u?: string) => !!u && /^https?:\/\//i.test(u);

  return (
    <section className="my-12" aria-label={lang === "en" ? "Card news" : "카드뉴스"}>
      <p className="font-serif text-xs font-bold uppercase tracking-[0.3em] text-gold-deep">
        {lang === "en" ? "Card News" : "카드뉴스"}
      </p>

      {/* 커버(표지) — 항상 첫 슬라이드 */}
      {cover && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-gold/30 bg-surface">
          {cover.image && (
            <div className="relative aspect-[4/5] w-full sm:aspect-[16/9]">
              <Image
                src={cover.image}
                alt={cover.title ?? "cover"}
                fill
                sizes="(max-width: 640px) 100vw, 720px"
                className="object-cover"
                unoptimized={isRemote(cover.image)}
              />
            </div>
          )}
          {(cover.title || cover.body) && (
            <div className="p-5">
              {cover.title && (
                <h3 className="font-serif text-lg font-bold text-primary">{cover.title}</h3>
              )}
              {cover.body && (
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-text-muted">
                  {cover.body}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 본문 카드들 */}
      {rest.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {rest.map((s, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-line bg-surface">
              {s.image && (
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={s.image}
                    alt={s.title ?? `card ${i + 2}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 360px"
                    className="object-cover"
                    unoptimized={isRemote(s.image)}
                  />
                </div>
              )}
              {(s.title || s.body) && (
                <div className="p-4">
                  {s.title && (
                    <h4 className="font-serif text-sm font-bold text-primary">{s.title}</h4>
                  )}
                  {s.body && (
                    <p className="mt-1.5 whitespace-pre-line text-xs leading-6 text-text-muted">
                      {s.body}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
