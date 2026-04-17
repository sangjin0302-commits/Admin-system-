"use client";

export { default } from "./error-stable";
/*
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
        <p className="ui-kicker">System Error</p>
        <h2 className="mt-2 ui-page-title">화면을 불러오지 못했습니다</h2>
        <p className="mt-3 text-sm text-text-muted">
          일시적인 오류일 수 있습니다. 다시 시도해도 계속 발생하면 잠시 후 새로고침하거나 관리자에게 로그를 확인해 주세요.
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
*/
