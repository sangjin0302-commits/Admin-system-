"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error", error);
  }, [error]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">System Recovery</p>
        <h2 className="mt-2 ui-page-title">화면을 불러오지 못했습니다.</h2>
        <p className="mt-3 text-sm text-text-muted">
          일시적인 오류가 발생했습니다. 다시 시도해도 같은 문제가 반복되면 관리자 화면에서 최근 변경 사항과
          연동 상태를 함께 확인해 주세요.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-text-muted">오류 식별값: {error.digest}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="primary" onClick={reset}>
            다시 시도
          </Button>
        </div>
      </Card>
    </div>
  );
}
