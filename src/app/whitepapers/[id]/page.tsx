import { notFound } from "next/navigation";
import { getWhitepaper } from "@/lib/services/whitepaper-service";
import { PurchaseButton } from "./purchase-button";

export const dynamic = "force-dynamic";

export default async function WhitepaperDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const wp = await getWhitepaper(id);
  if (!wp || !wp.published) return notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <p className="ui-kicker">Whitepaper</p>
      <h1 className="mt-3 font-serif text-3xl font-bold text-primary">{wp.title}</h1>
      <p className="mt-4 text-base text-text-muted whitespace-pre-line">{wp.description}</p>

      {wp.tocPreview.length > 0 && (
        <section className="mt-10 rounded-xl border border-line bg-surface p-6">
          <h2 className="font-serif text-lg font-bold text-primary">목차 미리보기</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-6 text-sm">
            {wp.tocPreview.map((t) => <li key={t}>{t}</li>)}
          </ol>
        </section>
      )}

      {wp.sampleUrl && (
        <section className="mt-6 rounded-xl border border-line bg-surface p-6">
          <h2 className="font-serif text-lg font-bold text-primary">샘플 (첫 3페이지 · 워터마크)</h2>
          <a href={wp.sampleUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary underline">
            샘플 PDF 열기
          </a>
        </section>
      )}

      <section className="mt-10 rounded-xl border border-primary bg-gradient-to-b from-gold-soft/20 to-transparent p-8">
        <p className="text-3xl font-bold text-primary">₩{wp.price.toLocaleString()}</p>
        <PurchaseButton whitepaperId={wp.id} price={wp.price} />
      </section>
    </main>
  );
}
