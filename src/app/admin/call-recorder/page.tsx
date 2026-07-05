import { CallRecorderClient } from "@/components/admin/call-recorder-client";

export const dynamic = "force-dynamic";

export default function AdminCallRecorderPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">실시간 통화 기록기</h1>
        <p className="mt-1 text-sm text-text-muted">
          상담 통화 중 실시간으로 음성을 텍스트로 변환하고, 종료 시 AI 요약·액션 아이템·견적 범위 추정 후 새 의뢰로 저장할 수 있습니다.
        </p>
      </div>
      <CallRecorderClient />
    </div>
  );
}
