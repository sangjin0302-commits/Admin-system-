import Link from "next/link";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import QuoteCalcClient from "./quote-calc-client";

export const dynamic = "force-dynamic";

export default async function QuoteCalcPage() {
  if (!(await isFeatureEnabled("quote_calculator"))) {
    return (
      <div className="p-6">
        <p className="text-sm text-neutral-500">견적 계산기가 비활성화되어 있습니다.</p>
        <Link href="/admin/features" className="text-sm underline text-blue-600">
          기능 관리로 이동
        </Link>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">견적 계산기</h1>
        <p className="text-sm text-neutral-500 mt-1">
          사건유형과 옵션을 선택하면 즉시 견적이 계산됩니다. 상담 중 바로 안내하세요.
        </p>
      </div>
      <QuoteCalcClient />
    </div>
  );
}
