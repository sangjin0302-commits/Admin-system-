import { Card } from "@/components/ui/card";
import { OcrUploader } from "./ocr-uploader";

export const dynamic = "force-dynamic";

export default function OcrPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <p className="ui-kicker">AI Tools</p>
        <h1 className="ui-page-title">OCR Document Extraction</h1>
        <p className="mt-1 text-sm text-text-muted">
          Extract text, ID-card fields, or invoice details from uploaded images.
        </p>
      </div>
      <Card>
        <OcrUploader />
      </Card>
    </div>
  );
}
