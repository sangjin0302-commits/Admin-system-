import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

import {
  listSignatureRequests,
  type SignatureRequestSummary,
} from "@/lib/services/e-signature-service";

import { NewSignatureButton } from "./new-signature-button";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<SignatureRequestSummary["status"], { text: string; className: string }> = {
  pending: { text: "서명 대기", className: "bg-amber-100 text-amber-800" },
  signed: { text: "서명 완료", className: "bg-emerald-100 text-emerald-800" },
  expired: { text: "만료", className: "bg-gray-100 text-gray-600" },
  rejected: { text: "거부/취소", className: "bg-rose-100 text-rose-800" },
  not_found: { text: "없음", className: "bg-gray-100 text-gray-600" },
};

export default function SignaturesPage() {
  const requests = listSignatureRequests();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Documents"
        title="전자 서명"
        description="계약서 및 동의서에 대한 전자 서명 요청을 관리합니다."
        action={<NewSignatureButton />}
      />

      {requests.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-text-muted">서명 요청 내역이 없습니다.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs font-semibold text-text-muted">
              <tr>
                <th className="px-5 py-3">문서</th>
                <th className="px-5 py-3">서명자</th>
                <th className="px-5 py-3">이메일</th>
                <th className="px-5 py-3">상태</th>
                <th className="px-5 py-3">생성일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {requests.map((r) => {
                const badge = STATUS_LABEL[r.status];
                return (
                  <tr key={r.requestId}>
                    <td className="px-5 py-3 font-medium text-text-strong">{r.documentTitle}</td>
                    <td className="px-5 py-3 text-text-muted">{r.signerName}</td>
                    <td className="px-5 py-3 text-text-muted">{r.signerEmail}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                        {badge.text}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-muted">
                      {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
