import { Card } from "@/components/ui/card";
import { DocumentPreview } from "@/components/admin/document-preview";

export const dynamic = "force-dynamic";

const SAMPLES = [
  {
    fileName: "sample.pdf",
    url: "/sample.pdf",
    mimeType: "application/pdf",
    label: "샘플 PDF",
  },
  {
    fileName: "sample-image.png",
    url: "/icons/tracking-512.svg",
    mimeType: "image/svg+xml",
    label: "샘플 이미지",
  },
  {
    fileName: "archive.zip",
    url: "/sample.zip",
    mimeType: "application/zip",
    label: "샘플 압축파일 (다운로드)",
  },
];

export default function DocumentViewerPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="ui-kicker">Tools</p>
        <h1 className="ui-page-title">문서 미리보기 데모</h1>
      </div>

      <p className="text-sm text-text-muted">
        DocumentPreview 컴포넌트를 테스트할 수 있는 데모 페이지입니다. PDF, 이미지, 기타 파일 유형의
        동작을 확인하세요.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLES.map((s) => (
          <Card key={s.fileName}>
            <div className="space-y-3 p-5">
              <div>
                <p className="font-serif text-sm font-bold text-primary">{s.label}</p>
                <p className="mt-1 truncate text-xs text-text-muted">{s.fileName}</p>
                <p className="text-[10px] uppercase tracking-wider text-gold-deep">
                  {s.mimeType}
                </p>
              </div>
              <DocumentPreview url={s.url} mimeType={s.mimeType} fileName={s.fileName} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
