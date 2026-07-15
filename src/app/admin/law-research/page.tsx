import { LawResearchPanel } from "@/components/admin/law-research-panel";

export const dynamic = "force-dynamic";

export default function AdminLawResearchPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">법령·판례 리서치</h1>
        <p className="text-sm text-gray-500 mt-1">
          국가법령정보센터(법제처) API를 통해 법령·판례·해석례를 검색합니다.
        </p>
      </div>
      <LawResearchPanel />
    </div>
  );
}
