import Link from "next/link";

import type { LandingBlock } from "@/lib/services/landing-page-service";

function asStr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function withUtm(href: string, slug: string): string {
  try {
    // Only append UTM for internal /intake links.
    if (!href.startsWith("/intake") && !href.startsWith("/")) return href;
    const [path, query = ""] = href.split("?");
    const params = new URLSearchParams(query);
    if (!params.has("utm_source")) params.set("utm_source", `landing_${slug}`);
    if (!params.has("utm_medium")) params.set("utm_medium", "landing");
    if (!params.has("utm_campaign")) params.set("utm_campaign", slug);
    const q = params.toString();
    return q ? `${path}?${q}` : path;
  } catch {
    return href;
  }
}

export function LandingBlocks({ blocks, slug }: { blocks: LandingBlock[]; slug: string }) {
  return (
    <>
      {blocks.map((block) => {
        switch (block.type) {
          case "hero":
            return <HeroBlock key={block.id} data={block.data} slug={slug} />;
          case "stats":
            return <StatsBlock key={block.id} data={block.data} />;
          case "testimonial":
            return <TestimonialBlock key={block.id} data={block.data} />;
          case "faq":
            return <FaqBlock key={block.id} data={block.data} />;
          case "cta":
            return <CtaBlock key={block.id} data={block.data} slug={slug} />;
          default:
            return null;
        }
      })}
    </>
  );
}

function HeroBlock({ data, slug }: { data: Record<string, unknown>; slug: string }) {
  const eyebrow = asStr(data.eyebrow);
  const title = asStr(data.title);
  const subtitle = asStr(data.subtitle);
  const ctaLabel = asStr(data.ctaLabel, "무료 검토 신청");
  const ctaHref = withUtm(asStr(data.ctaHref, "/intake"), slug);
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        {eyebrow && <p className="ethos-eyebrow">{eyebrow}</p>}
        {title && <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">{title}</h1>}
        {subtitle && (
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-text-muted">{subtitle}</p>
        )}
        {ctaLabel && (
          <div className="mt-8">
            <Link
              href={ctaHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-bold text-white shadow-sm transition hover:bg-text-strong"
            >
              {ctaLabel} →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function StatsBlock({ data }: { data: Record<string, unknown> }) {
  const title = asStr(data.title);
  const items = Array.isArray(data.items) ? data.items : [];
  return (
    <section className="ethos-band ethos-band-soft py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {title && <h2 className="ethos-display text-center text-2xl sm:text-3xl">{title}</h2>}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items
            .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
            .map((item, idx) => (
              <div key={idx} className="ethos-card p-6 text-center">
                <p className="ethos-display text-3xl text-primary">{asStr(item.value)}</p>
                <p className="mt-2 text-sm text-text-muted">{asStr(item.label)}</p>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialBlock({ data }: { data: Record<string, unknown> }) {
  const quote = asStr(data.quote);
  const author = asStr(data.author);
  const context = asStr(data.context);
  if (!quote) return null;
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <blockquote className="ethos-card p-8">
          <p className="ethos-quote text-lg leading-8 text-text">“{quote}”</p>
          <footer className="mt-4 text-sm text-text-muted">
            — <span className="font-semibold text-text-strong">{author}</span>
            {context && <span> · {context}</span>}
          </footer>
        </blockquote>
      </div>
    </section>
  );
}

function FaqBlock({ data }: { data: Record<string, unknown> }) {
  const title = asStr(data.title, "자주 묻는 질문");
  const items = Array.isArray(data.items) ? data.items : [];
  return (
    <section className="ethos-band ethos-band-soft py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="ethos-display text-center text-2xl sm:text-3xl">{title}</h2>
        <div className="mt-8 space-y-3">
          {items
            .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
            .map((item, idx) => {
              const q = asStr(item.q);
              const a = asStr(item.a);
              if (!q && !a) return null;
              return (
                <details key={idx} className="ethos-card p-5">
                  <summary className="cursor-pointer font-semibold text-text-strong">{q}</summary>
                  <p className="mt-3 text-sm leading-7 text-text-muted">{a}</p>
                </details>
              );
            })}
        </div>
      </div>
    </section>
  );
}

function CtaBlock({ data, slug }: { data: Record<string, unknown>; slug: string }) {
  const title = asStr(data.title, "지금 시작하세요");
  const subtitle = asStr(data.subtitle);
  const ctaLabel = asStr(data.ctaLabel, "무료 검토 신청");
  const ctaHref = withUtm(asStr(data.ctaHref, "/intake"), slug);
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div
          className="ethos-grain relative overflow-hidden rounded-[24px] border border-gold/30 p-10 text-center shadow-floating sm:p-14"
          style={{
            backgroundColor: "rgb(22 50 80)",
            backgroundImage: "linear-gradient(135deg, rgb(22 50 80) 0%, rgb(18 40 65) 50%, rgb(12 28 48) 100%)"
          }}
        >
          <h2 className="ethos-display text-2xl text-white sm:text-3xl">{title}</h2>
          {subtitle && <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/80">{subtitle}</p>}
          <div className="mt-8">
            <Link
              href={ctaHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gold px-7 text-sm font-bold text-primary shadow-md hover:bg-gold-soft"
            >
              {ctaLabel} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
