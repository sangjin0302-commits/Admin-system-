import { Card } from "@/components/ui/card";
import { Transcriber } from "./transcriber";

export const dynamic = "force-dynamic";

export default function TranscriptionPage() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">AI Tools</p>
        <h2 className="mt-2 ui-page-title">음성 전사 (Whisper)</h2>
        <p className="mt-2 text-sm text-text-muted">
          상담 녹음 파일을 텍스트로 변환하고 요약·액션 아이템을 자동 추출합니다.
        </p>
      </Card>
      <Transcriber />
    </div>
  );
}
