import { notFound } from "next/navigation";
import { getRegion } from "@/lib/services/international-site-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";
export const metadata = { title: "ETHOS · Việt Nam" };

export default async function VnLandingPage() {
  if (!(await isFeatureEnabled("international_regions"))) notFound();
  const cfg = await getRegion("vn");
  if (!cfg.enabled) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <p className="ui-kicker">Vietnam · Việt Nam</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-primary sm:text-4xl">{cfg.heroTitle}</h1>
      <p className="mt-4 text-lg text-text-muted">{cfg.heroDescription}</p>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-serif font-bold text-primary">Dịch vụ</h2>
          <ul className="mt-3 space-y-1 text-sm">
            <li>· Thị thực / cư trú</li>
            <li>· Khiếu nại hành chính</li>
            <li>· Hợp đồng và điều tra sự thật</li>
            <li>· Giấy phép và cấp phép</li>
            <li>· Thành lập công ty</li>
          </ul>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-serif font-bold text-primary">Liên hệ</h2>
          <p className="mt-3 text-sm">Ngôn ngữ: {cfg.locale}</p>
          <p className="text-sm">Tiền tệ: {cfg.currency}</p>
          {cfg.contactEmail && <p className="mt-2 text-sm">Email: {cfg.contactEmail}</p>}
          {cfg.contactPhone && <p className="text-sm">Điện thoại: {cfg.contactPhone}</p>}
        </div>
      </section>
    </main>
  );
}
