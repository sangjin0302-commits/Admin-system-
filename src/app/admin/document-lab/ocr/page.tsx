import { DOCUMENT_TYPES } from "@/lib/services/document-ocr-service";
import { DocumentOcrClient } from "./document-ocr-client";

export const dynamic = "force-dynamic";

export default function DocumentOcrPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[20px] border border-line bg-surface p-6 shadow-panel">
        <h1 className="font-serif text-2xl font-bold text-primary">문서 OCR + 자동 분류</h1>
        <p className="mt-2 text-sm text-text-muted">
          Anthropic Vision (Claude Sonnet) 기반. 이미지 업로드 → 텍스트 추출 + 문서 유형 자동 분류.
        </p>
        <p className="mt-1 text-xs text-text-muted">지원 유형: {DOCUMENT_TYPES.join(" / ")}</p>
      </section>

      <DocumentOcrClient supportedTypes={DOCUMENT_TYPES as unknown as string[]} />
    </div>
  );
}
