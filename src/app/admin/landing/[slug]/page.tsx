import Link from "next/link";
import { notFound } from "next/navigation";

import { LandingBlockEditor } from "@/components/admin/landing-block-editor";
import { getLanding } from "@/lib/services/landing-page-service";

export const dynamic = "force-dynamic";

export default async function AdminLandingEditPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const landing = await getLanding(slug);
  if (!landing) notFound();

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="ui-kicker">마케팅 · 랜딩 편집</p>
          <h2 className="mt-2 text-xl font-semibold text-text-strong">{landing.title}</h2>
        </div>
        <Link href="/admin/landing" className="rounded border border-line px-3 py-1.5 text-xs">
          ← 목록
        </Link>
      </div>

      <div className="mt-6">
        <LandingBlockEditor landing={landing} />
      </div>
    </section>
  );
}
