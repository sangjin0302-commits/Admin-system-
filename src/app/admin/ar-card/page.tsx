import { headers } from "next/headers";

import { Card } from "@/components/ui/card";
import { ArCardQr } from "@/components/admin/ar-card-qr";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AR 명함 — 관리자",
};

export default async function AdminArCardPage() {
  const h = await headers();
  const host = h.get("host") ?? "localhost";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const arUrl = `${proto}://${host}/ar-card`;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">AR Business Card</p>
        <h1 className="mt-2 ui-page-title">AR 명함</h1>
        <p className="mt-2 text-sm text-text-muted">
          QR 코드를 스캔하면 3D 명함 씬(회전 로고 · 태그라인 · 연락처)이 뜹니다. WebXR 미지원 기기는
          2D 애니메이션으로 자동 강등됩니다.
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-text-strong">QR 코드</h2>
        <div className="mt-4 flex justify-center">
          <ArCardQr url={arUrl} size={260} />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-text-strong">인쇄용 명함 템플릿</h2>
        <div className="mt-4 flex items-center gap-6 rounded-lg border-2 border-dashed border-gold/50 bg-white p-6">
          <div className="flex-1">
            <p className="font-serif text-lg font-bold tracking-[0.3em] text-primary">ETHOS</p>
            <p className="mt-1 font-serif text-xs text-text-muted">에토스 행정사사무소</p>
            <p className="mt-4 text-xs text-text-muted">
              QR을 스캔하여 3D 명함을 확인하세요
            </p>
          </div>
          <ArCardQr url={arUrl} size={140} />
        </div>
        <p className="mt-3 text-xs text-text-muted">
          위 SVG를 다운받아 명함 인쇄 파일에 삽입할 수 있습니다.
        </p>
      </Card>
    </div>
  );
}
