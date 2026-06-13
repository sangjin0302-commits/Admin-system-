import { Card } from "@/components/ui/card";

type Upload = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
  clientName?: string;
};

export function PortalUploadedFilesPanel({ uploads }: { uploads: readonly Upload[] }) {
  if (uploads.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-base font-semibold text-text-strong">의뢰인 업로드 자료</h3>
        <p className="mt-3 text-sm text-text-muted">의뢰인이 포털에서 업로드한 자료가 없습니다.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-strong">의뢰인 업로드 자료</h3>
        <span className="text-xs text-text-muted">{uploads.length}건</span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full divide-y divide-line text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-3 py-2 font-semibold">파일명</th>
              <th className="px-3 py-2 font-semibold">유형</th>
              <th className="px-3 py-2 font-semibold">크기</th>
              <th className="px-3 py-2 font-semibold">업로드 일자</th>
              <th className="px-3 py-2 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {uploads.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-3 font-medium text-text-strong">{u.fileName}</td>
                <td className="px-3 py-3 text-text-muted">{u.mimeType.split("/")[1] ?? u.mimeType}</td>
                <td className="px-3 py-3 text-text-muted">{(u.sizeBytes / 1024).toFixed(1)} KB</td>
                <td className="px-3 py-3 text-text-muted">
                  {new Date(u.uploadedAt).toLocaleString("ko-KR")}
                </td>
                <td className="px-3 py-3">
                  <a
                    href={`/api/admin/case-matters/uploaded-files/${u.id}`}
                    className="inline-flex h-8 items-center rounded-md border border-line bg-surface px-3 text-xs font-medium text-text-strong hover:bg-surface-muted"
                  >
                    다운로드
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
