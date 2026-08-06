import { notFound } from "next/navigation";
import Link from "next/link";
import { listDatasets } from "@/lib/services/dataset-marketplace-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

// 데이터셋 카탈로그(DB, searchParams 미사용) → ISR. 함수호출 절감.
export const revalidate = 3600;
export const metadata = { title: "AI 학습 데이터셋 · ETHOS" };

export default async function DatasetsCatalogPage() {
  if (!(await isFeatureEnabled("dataset_marketplace"))) notFound();
  const datasets = await listDatasets();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <p className="ui-kicker">Datasets</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-primary">행정 도메인 AI 학습 데이터셋</h1>
      <p className="mt-2 text-text-muted">
        비자·심판·계약 실무 익명화 데이터. 연구용/상업용 라이선스.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {datasets.map((d) => (
          <div key={d.id} className="rounded-xl border border-line bg-surface p-5 shadow-panel">
            <p className="text-xs font-bold uppercase text-gold-deep">{d.category} · {d.license}</p>
            <h2 className="mt-1 font-serif text-lg font-bold text-primary">{d.name}</h2>
            <p className="mt-2 text-sm text-text-muted">{d.description}</p>
            <p className="mt-3 text-sm">
              {d.size.toLocaleString()}건 · ₩{d.price.toLocaleString()}
            </p>
            {d.sampleJsonl && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-bold text-primary">샘플 미리보기</summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded bg-white p-2 text-[10px]">
                  {d.sampleJsonl.slice(0, 400)}
                </pre>
              </details>
            )}
            <Link
              href={`/datasets/${d.id}`}
              className="mt-4 inline-block rounded bg-primary px-3 py-1.5 text-xs font-bold text-white"
            >
              구매하기
            </Link>
          </div>
        ))}
        {datasets.length === 0 && (
          <p className="col-span-full py-16 text-center text-text-muted">준비된 데이터셋이 아직 없습니다.</p>
        )}
      </div>
    </main>
  );
}
