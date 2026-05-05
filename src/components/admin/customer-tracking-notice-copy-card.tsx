"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  buildCustomerTrackingNoticeTemplate,
  CUSTOMER_TRACKING_NOTICE_EMPTY_MESSAGE
} from "@/lib/services/customer-tracking-notice-template";

type CopyStatus = "idle" | "success" | "fallback";

export function CustomerTrackingNoticeCopyCard({
  trackingCode
}: {
  trackingCode: string | null;
}) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const notice = useMemo(
    () => buildCustomerTrackingNoticeTemplate({ trackingCode }),
    [trackingCode]
  );

  async function copyNotice() {
    if (!notice) return;

    try {
      await navigator.clipboard.writeText(notice);
      setCopyStatus("success");
    } catch {
      setCopyStatus("fallback");
    }
  }

  if (!notice) {
    return (
      <Card muted className="mt-5 p-5">
        <p className="ui-kicker">접수번호 및 진행상황 안내</p>
        <p className="mt-3 text-sm text-text-muted">{CUSTOMER_TRACKING_NOTICE_EMPTY_MESSAGE}</p>
      </Card>
    );
  }

  return (
    <Card muted className="mt-5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="ui-kicker">접수번호 및 진행상황 안내</p>
          <div className="mt-2 space-y-1 text-sm text-text-muted">
            <p>고객에게 접수번호와 진행상황 확인 링크를 안내할 수 있습니다.</p>
            <p>아래 안내문을 복사해 문자, 카카오톡, 이메일 등으로 전달하세요.</p>
            <p>이 기능은 안내문 복사만 제공하며 실제 발송은 실행하지 않습니다.</p>
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={copyNotice}>
          고객 안내문 복사
        </Button>
      </div>
      <Textarea
        className="mt-4 min-h-56 text-sm"
        readOnly
        value={notice}
        aria-label="고객 안내문"
      />
      {copyStatus === "success" ? (
        <p className="mt-3 text-sm font-semibold text-emerald-700">안내문을 복사했습니다.</p>
      ) : null}
      {copyStatus === "fallback" ? (
        <p className="mt-3 text-sm font-semibold text-amber-700">
          안내문을 직접 선택해 복사해 주세요.
        </p>
      ) : null}
    </Card>
  );
}
