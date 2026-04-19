"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const KO_TITLE = "\uAD00\uB9AC\uC790 \uD654\uBA74\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
const KO_DESCRIPTION =
  "\uB370\uC774\uD130 \uC751\uB2F5\uC774 \uC77C\uC2DC\uC801\uC73C\uB85C \uC9C0\uC5F0\uB418\uAC70\uB098 \uC5F0\uB3D9 \uC0C1\uD0DC\uAC00 \uBD88\uC548\uC815\uD55C \uC0C1\uD0DC\uC785\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uBA74 \uB300\uBD80\uBD84 \uBCF5\uAD6C\uB429\uB2C8\uB2E4.";
const KO_RETRY_LABEL = "\uAD00\uB9AC\uC790 \uD654\uBA74 \uB2E4\uC2DC \uC5F4\uAE30";

export default function AdminErrorSafeV2({
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
      <h2 className="mt-2 ui-page-title">{KO_TITLE}</h2>
      <p className="mt-3 text-sm text-text-muted">{KO_DESCRIPTION}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" variant="primary" onClick={reset}>
          {KO_RETRY_LABEL}
        </Button>
      </div>
    </Card>
  );
}
