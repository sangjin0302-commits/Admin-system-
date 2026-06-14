import { Reveal } from "@/components/public/reveal";
import {
  TESTIMONIAL_CATEGORY_LABELS as CATEGORY_BADGE,
  type PublicTestimonial
} from "@/lib/services/testimonials";

export function Testimonials({ items }: { items: PublicTestimonial[] }) {
  const TESTIMONIALS = items;
  if (TESTIMONIALS.length === 0) return null;
  return (
    <section className="ethos-band ethos-band-soft py-24 sm:py-28" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="ethos-eyebrow">Client Voices</p>
          <h2 id="testimonials-heading" className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">
            의뢰인 후기
          </h2>
          <p className="mt-4 text-sm text-text-muted">
            개인정보 보호를 위해 익명·요약 처리된 후기입니다. 사안마다 결과는 다를 수 있습니다.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delay={((i % 2) + 1) as 1 | 2}>
              <figure className="ethos-card ethos-card-hover relative h-full overflow-hidden p-9">
                {/* 큰 따옴표 장식 */}
                <span
                  aria-hidden
                  className="ethos-quote pointer-events-none absolute -right-1 -top-2 select-none text-[7rem] leading-none text-gold/15"
                >
                  &ldquo;
                </span>

                <span className="relative inline-flex items-center rounded-full bg-gold-soft/60 px-3 py-1 font-serif text-[11px] font-bold text-gold-deep">
                  {CATEGORY_BADGE[t.category]}
                </span>

                <blockquote className="relative mt-6">
                  <p className="ethos-quote text-base leading-8 text-text">&ldquo;{t.quote}&rdquo;</p>
                </blockquote>

                <figcaption className="relative mt-7 border-t border-gold/15 pt-5">
                  <p className="font-serif text-sm font-bold text-primary">{t.author}</p>
                  <p className="mt-1 text-xs text-text-muted">{t.context}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
