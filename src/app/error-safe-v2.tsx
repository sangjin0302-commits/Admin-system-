"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const KO_TITLE = "\uD654\uBA74\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
const KO_DESCRIPTION =
  "\uC77C\uC2DC\uC801\uC778 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uB3C4 \uAC19\uC740 \uBB38\uC81C\uAC00 \uBC18\uBCF5\uB418\uBA74 \uAD00\uB9AC\uC790 \uD654\uBA74\uC5D0\uC11C \uCD5C\uADFC \uBCC0\uACBD \uC0AC\uD56D\uACFC \uC5F0\uB3D9 \uC0C1\uD0DC\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.";
const KO_RETRY_LABEL = "\uB2E4\uC2DC \uC2DC\uB3C4";

export default function GlobalErrorSafeV2({
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
        <h2 className="mt-2 ui-page-title">{KO_TITLE}</h2>
        <p className="mt-3 text-sm text-text-muted">{KO_DESCRIPTION}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="primary" onClick={reset}>
            {KO_RETRY_LABEL}
          </Button>
        </div>
      </Card>
    </div>
  );
}
