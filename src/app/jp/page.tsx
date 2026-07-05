import { notFound } from "next/navigation";
import { getRegion } from "@/lib/services/international-site-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";
export const metadata = { title: "ETHOS · 日本" };

export default async function JpLandingPage() {
  if (!(await isFeatureEnabled("international_regions"))) notFound();
  const cfg = await getRegion("jp");
  if (!cfg.enabled) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <p className="ui-kicker">Japan · 日本</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-primary sm:text-4xl">{cfg.heroTitle}</h1>
      <p className="mt-4 text-lg text-text-muted">{cfg.heroDescription}</p>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-serif font-bold text-primary">対応業務</h2>
          <ul className="mt-3 space-y-1 text-sm">
            <li>· 在留資格変更・更新</li>
            <li>· 行政不服審査・審判</li>
            <li>· 契約書レビュー・事実調査</li>
            <li>· 許認可申請</li>
            <li>· 法人設立</li>
          </ul>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-serif font-bold text-primary">お問い合わせ</h2>
          <p className="mt-3 text-sm">言語: {cfg.locale}</p>
          <p className="text-sm">通貨: {cfg.currency}</p>
          {cfg.contactEmail && <p className="mt-2 text-sm">Email: {cfg.contactEmail}</p>}
          {cfg.contactPhone && <p className="text-sm">Tel: {cfg.contactPhone}</p>}
        </div>
      </section>
    </main>
  );
}
