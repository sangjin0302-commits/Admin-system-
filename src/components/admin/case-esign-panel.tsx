import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";
import { SendDelegationButton } from "./send-delegation-button";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  SIGNED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
  EXPIRED: "bg-gray-100 text-gray-600",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "서명 대기",
  SIGNED: "서명 완료",
  REJECTED: "거부/취소",
  EXPIRED: "만료",
};

const PROVIDER_LABEL: Record<string, string> = {
  MODUSIGN: "모두싸인",
  IN_MEMORY: "내부 클릭",
};

export async function CaseESignPanel({ caseId }: { caseId: string }) {
  const requests = await prisma.eSignRequest
    .findMany({
      where: { caseId },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
    .catch(() => []);

  return (
    <Card className="p-4 md:p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-text-muted">E-Signature</p>
          <h3 className="text-sm font-semibold text-text-strong">
            위임장 · 계약서 서명
          </h3>
        </div>
        <SendDelegationButton caseId={caseId} />
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-text-muted">
          아직 발송된 서명 요청이 없습니다. 우측 버튼으로 위임장/수임계약서/동의서를
          발송하세요.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {requests.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-strong">
                  {r.documentTitle}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {r.signerName} · {r.signerEmail} ·{" "}
                  {PROVIDER_LABEL[r.provider] ?? r.provider}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  발송 {new Date(r.createdAt).toLocaleString("ko-KR")}
                  {r.signedAt && (
                    <>
                      {" · "}서명 {new Date(r.signedAt).toLocaleString("ko-KR")}
                    </>
                  )}
                </p>
                {r.signUrl && r.status === "PENDING" && (
                  <a
                    href={r.signUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-blue-600 underline"
                  >
                    서명 링크 열기 →
                  </a>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[r.status] ?? ""}`}
              >
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
