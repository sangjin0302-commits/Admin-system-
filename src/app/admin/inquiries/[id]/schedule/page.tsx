import Link from "next/link";

import { SchedulingBotClient } from "@/components/admin/scheduling-bot-client";
import { InquiryDetailUnavailable } from "@/components/admin/inquiry-detail-common";
import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { prisma } from "@/lib/prisma/client";
import { getSchedulingSession } from "@/lib/services/scheduling-bot-service";

export const dynamic = "force-dynamic";

export default async function AdminSchedulingPage({
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
    select: { id: true, contactName: true, email: true, title: true }
  });
  if (!inquiry) {
    return (
      <InquiryDetailUnavailable
        title="문의를 찾을 수 없습니다."
        message="이미 삭제되었거나 접근할 수 없는 문의입니다."
      />
    );
  }
  const existing = await getSchedulingSession(inquiryId);

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
        <h1 className="text-xl font-semibold">AI 일정 조율 봇</h1>
        <p className="mt-1 text-sm text-text-muted">
          {inquiry.contactName} ({inquiry.email}) · {inquiry.title}
        </p>
      </div>

      <SchedulingBotClient inquiryId={inquiry.id} initialSession={existing} />
    </div>
  );
}
