import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { VisionUploader } from "./vision-uploader";

export const dynamic = "force-dynamic";

export default function VisionPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="AI Vision"
        title="이미지 분석"
        description="Claude 멀티모달 비전으로 문서·신분증·양식·현장 사진을 분석합니다."
      />

      <Card className="p-6">
        <VisionUploader />
      </Card>
    </div>
  );
}
