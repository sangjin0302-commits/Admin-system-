import Link from "next/link";

import { Card } from "@/components/ui/card";

export function InquiryDetailUnavailable(input: {
  title: string;
  message: string;
  detail?: string | null;
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Inquiry Detail Recovery</p>
        <h2 className="mt-2 ui-page-title">{input.title}</h2>
        <p className="mt-3 text-sm text-text-muted">{input.message}</p>
        {input.detail ? (
          <p className="mt-3 rounded-xl border border-line bg-surface-muted px-3 py-2 text-xs text-text-muted">
            상세 정보: {input.detail}
          </p>
        ) : null}
        <div className="mt-4">
          <Link
            href="/admin/inquiries"
            className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
          >
            문의 목록으로 이동
          </Link>
        </div>
      </Card>
    </div>
  );
}

export function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <Card muted className="p-4">
      <p className="ui-kicker">{label}</p>
      <p className="mt-2 text-sm text-text">{value || "-"}</p>
    </Card>
  );
}

export function TextPanel({ title, content }: { title: string; content: string }) {
  return (
    <Card muted className="mt-4 p-5">
      <p className="ui-kicker">{title}</p>
      <p className="mt-3 whitespace-pre-line text-sm text-text">{content}</p>
    </Card>
  );
}
