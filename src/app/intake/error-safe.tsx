"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function IntakeErrorSafe({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Intake route error", error);
  }, [error]);

  return (
    <Card className="p-6">
      <p className="ui-kicker">Intake Recovery</p>
      <h2 className="mt-2 ui-page-title">접수 화면을 불러오지 못했습니다.</h2>
      <p className="mt-3 text-sm text-text-muted">
        일시적인 오류가 발생했습니다. 다시 시도해도 문제가 반복되면 잠시 후 다시 접속해 주세요.
      </p>
      {error.digest ? (
        <p className="mt-3 text-xs text-text-muted">오류 식별값: {error.digest}</p>
      ) : null}
      <div className="mt-5">
        <Button type="button" onClick={reset}>
          접수 화면 다시 열기
        </Button>
      </div>
    </Card>
  );
}
