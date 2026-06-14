import { Reveal } from "@/components/public/reveal";

type Testimonial = {
  quote: string;
  author: string;
  context: string;
  category: string;
};

const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      "처분서를 받고 막막했는데, 처음 상담 때부터 청구기한과 다음 단계를 정확히 짚어주셔서 마음이 놓였습니다.",
    author: "박○○",
    context: "영업정지 처분 행정심판",
    category: "ADMIN_APPEAL"
  },
  {
    quote:
      "체류 자격 변경 자료가 복잡했는데, 점수제 항목별로 무엇이 부족한지 명확히 안내해주셔서 차근차근 준비할 수 있었습니다.",
    author: "Mr. T",
    context: "F-2 자격 변경",
    category: "VISA_STAY"
  },
  {
    quote:
      "분쟁 사실관계가 너무 얽혀 있었는데, 시점별로 정리해주신 보고서가 이후 협의에 결정적이었습니다.",
    author: "김○○",
    context: "용역계약 사실조사",
    category: "CONTRACT_INVESTIGATION"
  },
  {
    quote:
      "보완 요청을 받고 당황했지만 어떤 자료를 어떻게 보완하면 되는지 단계별로 알려주셔서 빠르게 대응할 수 있었습니다.",
    author: "이○○",
    context: "음식점 영업허가",
    category: "LICENSE_PERMIT"
  }
];

const CATEGORY_BADGE: Record<string, string> = {
  VISA_STAY: "비자/체류",
  ADMIN_APPEAL: "행정심판",
  CONTRACT_INVESTIGATION: "계약서/사실조사",
  LICENSE_PERMIT: "인허가"
};

export function Testimonials() {
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
