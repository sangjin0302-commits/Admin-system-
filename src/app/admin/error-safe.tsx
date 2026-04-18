"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminErrorSafe({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error", error);
  }, [error]);

  return (
    <Card className="p-6">
      <p className="ui-kicker">Admin Recovery</p>
      <h2 className="mt-2 ui-page-title">관리자 화면을 불러오지 못했습니다.</h2>
      <p className="mt-3 text-sm text-text-muted">
        데이터 응답이 일시적으로 지연되었거나 외부 연동 상태가 불안정할 수 있습니다. 다시 시도하면 대부분
        복구됩니다.
      </p>
      {error.digest ? (
        <p className="mt-3 text-xs text-text-muted">오류 식별값: {error.digest}</p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" variant="primary" onClick={reset}>
          관리자 화면 다시 열기
        </Button>
      </div>
    </Card>
  );
}
