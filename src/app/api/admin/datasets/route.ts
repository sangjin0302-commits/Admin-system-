import { NextResponse } from "next/server";
import { listDatasets, upsertDataset, type DatasetCategory, type DatasetLicense } from "@/lib/services/dataset-marketplace-service";

export async function GET() {
  const datasets = await listDatasets(true);
  return NextResponse.json({ ok: true, datasets });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.name || typeof body?.price !== "number" || !body?.category) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  const ds = await upsertDataset({
    id: body.id,
    name: String(body.name),
    description: body.description ? String(body.description) : "",
    category: body.category as DatasetCategory,
    price: Number(body.price),
    size: typeof body.size === "number" ? body.size : 0,
    license: (body.license as DatasetLicense) ?? "research",
    sampleJsonl: body.sampleJsonl ? String(body.sampleJsonl) : undefined,
    published: Boolean(body.published),
  });
  return NextResponse.json({ ok: true, dataset: ds });
}
