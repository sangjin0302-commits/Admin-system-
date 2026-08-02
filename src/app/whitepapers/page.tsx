import Link from "next/link";
import { listWhitepapers, type WhitepaperCategory } from "@/lib/services/whitepaper-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { FeatureComingSoon } from "@/components/public/feature-coming-soon";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI 법률 백서 · ETHOS" };

const CAT_LABELS: Record<WhitepaperCategory, string> = {
  practice_guide: "실무 가이드",
  case_analysis: "판례 분석",
  procedure_guide: "절차 가이드",
};

export default async function WhitepapersPage() {
  // 유료 구매 흐름 포함 — 검증 전 기본 비활성(잠금). /admin/features 에서 켤 수 있음.
  if (!(await isFeatureEnabled("whitepapers_enabled"))) {
    return <FeatureComingSoon title="법률 백서 준비 중" />;
  }
  const items = await listWhitepapers({ publishedOnly: true });
  const grouped: Record<WhitepaperCategory, typeof items> = {
    practice_guide: [], case_analysis: [], procedure_guide: [],
  };
  for (const w of items) grouped[w.category].push(w);

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <header className="text-center">
        <p className="ui-kicker">Insights</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-primary">AI 법률 백서</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-text-muted">
          실무 인사이트를 PDF로 압축했습니다. 판례 분석·절차 매뉴얼·서식 포함.
        </p>
      </header>

      {items.length === 0 ? (
        <p className="mt-16 text-center text-sm text-text-muted">아직 공개된 백서가 없습니다.</p>
      ) : (
        (Object.keys(grouped) as WhitepaperCategory[]).map((cat) => (
          grouped[cat].length > 0 && (
            <section key={cat} className="mt-14">
              <h2 className="font-serif text-2xl font-bold text-primary">{CAT_LABELS[cat]}</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[cat].map((w) => (
                  <Link
                    key={w.id}
                    href={`/whitepapers/${w.id}`}
                    className="group rounded-xl border border-line bg-surface p-6 transition hover:border-primary"
                  >
                    {w.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.coverImage} alt={w.title} className="mb-4 h-32 w-full rounded object-cover" />
                    )}
                    <h3 className="font-serif text-lg font-bold text-primary group-hover:underline">{w.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-text-muted">{w.description}</p>
                    <p className="mt-4 text-lg font-bold text-primary">₩{w.price.toLocaleString()}</p>
                  </Link>
                ))}
              </div>
            </section>
          )
        ))
      )}
    </main>
  );
}
