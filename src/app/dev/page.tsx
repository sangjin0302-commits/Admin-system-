import Link from "next/link";
import { notFound } from "next/navigation";
import { API_PRODUCTS } from "@/lib/services/api-marketplace-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { auth } from "@/lib/auth/auth";
import { IssueKeyButton } from "./issue-key-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "ETHOS 개발자 포털 · API 마켓" };

export default async function DevPortalPage() {
  if (!(await isFeatureEnabled("api_marketplace"))) notFound();
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <p className="ui-kicker">Developer Portal</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-primary">ETHOS API 마켓플레이스</h1>
      <p className="mt-2 text-text-muted">
        Lawbot·AI 초안·인용검증 등을 REST API로 사용하세요. 종량제 + 월정액.
      </p>

      {!isLoggedIn && (
        <div className="mt-6 rounded border border-line bg-surface p-4 text-sm">
          API 키를 발급받으려면{" "}
          <Link href="/portal/signin?callbackUrl=/dev" className="font-bold text-primary underline">
            로그인
          </Link>
          이 필요합니다.
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {API_PRODUCTS.map((p) => (
          <div key={p.id} className="rounded-xl border border-line bg-surface p-5 shadow-panel">
            <p className="text-xs font-bold uppercase text-gold-deep">{p.id}</p>
            <h2 className="mt-1 font-serif text-lg font-bold text-primary">{p.name}</h2>
            <p className="mt-2 text-sm text-text-muted">{p.description}</p>
            <div className="mt-3 rounded bg-white px-3 py-2 font-mono text-xs">
              POST {p.endpoint}
            </div>
            <p className="mt-3 text-sm">
              ₩{p.pricing.perCall}/호출 · 월정액 ₩{p.pricing.monthly.toLocaleString()} (월 {p.monthlyQuota}회)
            </p>
            <div className="mt-3">
              <IssueKeyButton productId={p.id} isLoggedIn={isLoggedIn} />
            </div>
          </div>
        ))}
      </div>

      <section className="mt-12 rounded-xl border border-line bg-surface p-6">
        <h2 className="font-serif text-xl font-bold text-primary">인증 방법</h2>
        <p className="mt-2 text-sm">
          모든 요청은 <code className="rounded bg-white px-1">x-api-key</code> 헤더에 발급된 키를 넣어야 합니다.
        </p>
        <pre className="mt-3 overflow-x-auto rounded bg-white p-3 text-xs">
{`curl -X POST https://your-domain/api/v1/lawbot/analyze \\
  -H "x-api-key: ek_live_..." \\
  -H "content-type: application/json" \\
  -d '{"prompt": "체류자격 변경 관련..."}'`}
        </pre>
      </section>
    </main>
  );
}
