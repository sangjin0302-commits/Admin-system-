import Link from "next/link";
import { getCtaForCategory } from "@/lib/services/blog-cta-service";
import { toPublicCategory } from "@/lib/services/blog-categorizer";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export async function BlogCategoryCta({ category }: { category: string }) {
  const enabled = await isFeatureEnabled("blog_category_cta");
  if (!enabled) return null;

  const publicCat = toPublicCategory(category);
  const cta = getCtaForCategory(publicCat);

  return (
    <div
      className="ethos-grain relative mt-10 overflow-hidden rounded-2xl border border-gold/30 p-6 shadow-sm sm:p-8"
      style={{ backgroundColor: "#1a3c5f" }}
    >
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{
          background: "linear-gradient(to right, transparent, #c9a961, transparent)",
        }}
      />

      <p
        className="text-xs font-bold uppercase tracking-[0.2em]"
        style={{ color: "#c9a961" }}
      >
        상담 안내
      </p>

      <h3
        className="mt-3 text-xl font-bold sm:text-2xl"
        style={{
          color: "#fff",
          fontFamily: "'Georgia', 'Noto Serif KR', serif",
        }}
      >
        {cta.title}
      </h3>

      <p
        className="mt-3 text-sm leading-7"
        style={{ color: "rgba(255,255,255,0.8)" }}
      >
        {cta.description}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href={cta.href}
          data-funnel="blog_category_cta_primary"
          data-funnel-cat={publicCat}
          className="inline-flex h-11 items-center justify-center rounded-lg px-6 text-sm font-bold transition hover:brightness-95"
          style={{ backgroundColor: "#c9a961", color: "#1a3c5f" }}
        >
          무료 검토 요청 →
        </Link>
        <Link
          href="/consult"
          data-funnel="blog_category_cta_consult"
          className="inline-flex h-11 items-center justify-center rounded-lg border px-6 text-sm font-semibold transition hover:bg-white/10"
          style={{ borderColor: "rgba(201,169,97,0.5)", color: "rgba(255,255,255,0.8)" }}
        >
          상담 안내 보기
        </Link>
      </div>
    </div>
  );
}
