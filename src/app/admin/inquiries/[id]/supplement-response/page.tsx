import Link from "next/link";

import { SupplementResponseWorkbench } from "@/components/admin/supplement-response-workbench";
import { InquiryDetailUnavailable } from "@/components/admin/inquiry-detail-common";
import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminSupplementResponsePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inquiryId = normalizeAdminEntityId(id);

  if (!inquiryId) {
    return (
      <InquiryDetailUnavailable
        title="잘못된 문의 ID입니다."
        message="URL 형식이 올바르지 않습니다."
        detail={id.trim() || "empty-id"}
      />
    );
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: {
      id: true,
      title: true,
      contactName: true,
      caseMatters: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, caseNo: true, title: true }
      }
    }
  });

  if (!inquiry) {
    return (
      <InquiryDetailUnavailable
        title="문의를 찾을 수 없습니다."
        message="이미 삭제되었거나 접근할 수 없는 문의입니다."
      />
    );
  }

  const latestCase = inquiry.caseMatters[0] ?? null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/admin/inquiries/${inquiryId}`}
          className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
        >
          문의 상세로 돌아가기
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-semibold">기관 보완 요청 대응 서면 봇</h1>
        <p className="mt-1 text-sm text-text-muted">
          문의: <span className="font-medium">{inquiry.title}</span>
          {latestCase && (
            <>
              {" · "}
              연결 사건: <span className="font-medium">{latestCase.caseNo ?? latestCase.title}</span>
            </>
          )}
        </p>
      </div>

      {latestCase ? (
        <SupplementResponseWorkbench inquiryId={inquiry.id} caseId={latestCase.id} />
      ) : (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
          이 문의에 연결된 사건(CaseMatter)이 없습니다. 문의를 사건으로 전환한 후 다시 시도해 주세요.
        </div>
      )}
    </div>
  );
}
