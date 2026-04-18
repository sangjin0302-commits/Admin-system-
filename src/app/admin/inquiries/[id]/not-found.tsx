import Link from "next/link";

import { Card } from "@/components/ui/card";

export default function AdminInquiryNotFound() {
  return (
    <Card className="p-6">
      <p className="ui-kicker">Inquiry Detail</p>
      <h2 className="mt-2 ui-page-title">문의를 찾을 수 없습니다.</h2>
      <p className="mt-3 text-sm text-text-muted">
        이미 삭제되었거나 접근 권한이 없는 문의일 수 있습니다.
      </p>
      <div className="mt-4">
        <Link
          href="/admin/inquiries"
          className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
        >
          문의 목록으로 이동
        </Link>
      </div>
    </Card>
  );
}
