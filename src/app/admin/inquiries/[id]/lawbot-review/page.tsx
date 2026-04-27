import Link from "next/link";

import { InquiryDetailUnavailable } from "@/components/admin/inquiry-detail-common";
import { LawbotReviewReadonlyClient } from "@/components/admin/lawbot-review-readonly-client";
import { normalizeAdminEntityId } from "@/lib/http/admin-id";

export const dynamic = "force-dynamic";

export default async function AdminInquiryLawbotReviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inquiryId = normalizeAdminEntityId(id);

  if (!inquiryId) {
    return (
      <InquiryDetailUnavailable
        title="올바르지 않은 문의 ID입니다."
        message="URL 형식이 올바르지 않아 리뷰 화면을 불러올 수 없습니다."
        detail={id.trim() || "empty-id"}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/admin/inquiries/${inquiryId}`}
          className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
        >
          문의 상세로 돌아가기
        </Link>
        <Link
          href="/admin/inquiries"
          className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
        >
          문의 목록
        </Link>
      </div>

      <LawbotReviewReadonlyClient inquiryId={inquiryId} />
    </div>
  );
}
