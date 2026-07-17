import { MarketPanel } from "@/components/admin/market-panel";

export const dynamic = "force-dynamic";

export default function AdminMarketPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">시장·경쟁사 분석</h1>
        <p className="text-sm text-gray-500 mt-1">
          네이버 검색·데이터랩에서 수집한 행정사 시장 문서를 분류하여 경쟁사 동향과 여론을 분석합니다.
        </p>
      </div>
      <MarketPanel />
    </div>
  );
}
