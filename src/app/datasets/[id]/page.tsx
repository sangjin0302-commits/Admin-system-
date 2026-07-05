import { notFound } from "next/navigation";
import { getDataset } from "@/lib/services/dataset-marketplace-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { PurchaseForm } from "./purchase-form";

export const dynamic = "force-dynamic";

export default async function DatasetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isFeatureEnabled("dataset_marketplace"))) notFound();
  const { id } = await params;
  const ds = await getDataset(id);
  if (!ds || !ds.published) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="ui-kicker">Dataset</p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-primary">{ds.name}</h1>
      <p className="mt-1 text-sm text-text-muted">
        {ds.category} · {ds.license} · {ds.size.toLocaleString()}건
      </p>
      <p className="mt-4">{ds.description}</p>
      <p className="mt-4 text-2xl font-bold text-primary">₩{ds.price.toLocaleString()}</p>

      <div className="mt-8">
        <PurchaseForm datasetId={ds.id} amount={ds.price} />
      </div>
    </main>
  );
}
