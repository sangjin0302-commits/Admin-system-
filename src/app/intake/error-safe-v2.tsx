"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const KO_TITLE = "\uC811\uC218 \uD654\uBA74\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
const KO_DESCRIPTION =
  "\uC77C\uC2DC\uC801\uC778 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uB3C4 \uBB38\uC81C\uAC00 \uBC18\uBCF5\uB418\uBA74 \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC811\uC18D\uD574 \uC8FC\uC138\uC694.";
const KO_RETRY_LABEL = "\uC811\uC218 \uD654\uBA74 \uB2E4\uC2DC \uC5F4\uAE30";

export default function IntakeErrorSafeV2({
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
      <h2 className="mt-2 ui-page-title">{KO_TITLE}</h2>
      <p className="mt-3 text-sm text-text-muted">{KO_DESCRIPTION}</p>
      <div className="mt-5">
        <Button type="button" onClick={reset}>
          {KO_RETRY_LABEL}
        </Button>
      </div>
    </Card>
  );
}
