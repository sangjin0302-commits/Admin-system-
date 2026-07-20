import Link from "next/link";

/**
 * 글 채널 안내 — 법률 칼럼(국문) + LinkedIn(영문).
 *
 * 예전에는 홈에 '네이버 블로그 최신글'을 실시간으로 띄웠는데, /blog(법률 칼럼)가
 * 같은 네이버 글을 DB로 가져와 이미 보여주고 있어 내용이 중복이었다.
 * 게다가 홈 섹션은 방문자를 네이버로 내보내 우리 도메인에 쌓이는 SEO 자산을 깎았다.
 * 그래서 글은 /blog 하나로 모으고, 영문 독자를 위한 LinkedIn 을 함께 안내한다.
 */

/** 대표 LinkedIn 프로필. 국문·영문 페이지 모두에서 같은 주소를 쓴다. */
export const LINKEDIN_URL =
  "https://www.linkedin.com/in/kareem-sangjin-ji-052419212";

type Copy = {
  eyebrow: string;
  heading: string;
  columnTitle: string;
  columnDesc: string;
  columnCta: string;
  linkedinTitle: string;
  linkedinDesc: string;
  linkedinCta: string;
};

const KO: Copy = {
  eyebrow: "Writing",
  heading: "글로 먼저 확인해 보세요",
  columnTitle: "법률 칼럼",
  columnDesc:
    "비자·행정심판·계약·인허가·법인설립 실무를 사례 중심으로 정리합니다. 상담 전에 절차와 기한을 먼저 파악하실 수 있습니다.",
  columnCta: "칼럼 읽기",
  linkedinTitle: "LinkedIn · 영문 글",
  linkedinDesc:
    "한국 행정절차를 영어로 정리한 글을 올립니다. 외국인 의뢰인과 해외 파트너를 위한 채널입니다.",
  linkedinCta: "LinkedIn 프로필 보기",
};

const EN: Copy = {
  eyebrow: "Writing",
  heading: "Read before you reach out",
  columnTitle: "Legal Columns (Korean)",
  columnDesc:
    "Practical notes on visas, administrative appeals, contracts, permits, and company formation — organized around real procedures and deadlines.",
  columnCta: "Read the columns",
  linkedinTitle: "LinkedIn · English writing",
  linkedinDesc:
    "Korean administrative procedures explained in English — written for foreign residents, founders, and overseas partners.",
  linkedinCta: "View LinkedIn profile",
};

export function WritingChannels({ lang = "ko" }: { lang?: "ko" | "en" }) {
  const t = lang === "en" ? EN : KO;
  const blogHref = lang === "en" ? "/blog?lang=en" : "/blog";

  return (
    <section className="py-20 sm:py-24" aria-labelledby="writing-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="ethos-eyebrow">{t.eyebrow}</p>
          <h2 id="writing-heading" className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">
            {t.heading}
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Link
            href={blogHref}
            className="ethos-card ethos-card-hover ethos-card-topline group flex h-full flex-col p-8"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/40 bg-gold-soft/30 text-primary">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.4">
                <path d="M4 5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                <path d="M15 3v5h5M8 13h8M8 17h5" />
              </svg>
            </div>
            <h3 className="ethos-display mt-6 text-2xl">{t.columnTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-text">{t.columnDesc}</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-6 font-serif text-sm font-semibold text-primary transition-colors group-hover:text-gold-deep">
              {t.columnCta}
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </Link>

          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ethos-card ethos-card-hover ethos-card-topline group flex h-full flex-col p-8"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/40 bg-gold-soft/30 text-primary">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden>
                <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85V21H9z" />
              </svg>
            </div>
            <h3 className="ethos-display mt-6 text-2xl">{t.linkedinTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-text">{t.linkedinDesc}</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-6 font-serif text-sm font-semibold text-primary transition-colors group-hover:text-gold-deep">
              {t.linkedinCta}
              <span className="transition-transform duration-300 group-hover:translate-x-1">↗</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
