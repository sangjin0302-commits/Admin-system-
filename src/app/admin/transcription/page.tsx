import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Transcriber } from "./transcriber";

export const dynamic = "force-dynamic";

export default function TranscriptionPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="AI Tools"
        title="음성 전사 (Whisper)"
        description="상담 녹음 파일을 텍스트로 변환하고 요약·액션 아이템을 자동 추출합니다."
      />
      <Transcriber />
    </div>
  );
}
