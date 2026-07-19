import { Card } from "@/components/ui/card";
import { OcrUploader } from "./ocr-uploader";

export const dynamic = "force-dynamic";

export default function OcrPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <p className="ui-kicker">AI 도구</p>
        <h1 className="ui-page-title">문자 인식(OCR) 문서 추출</h1>
        <p className="mt-1 text-sm text-text-muted">
          업로드한 이미지에서 텍스트, 신분증 항목, 청구서 내역을 추출합니다.
        </p>
      </div>
      <Card>
        <OcrUploader />
      </Card>
    </div>
  );
}
