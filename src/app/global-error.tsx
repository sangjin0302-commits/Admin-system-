"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const KO_TITLE = "\uC2DC\uC2A4\uD15C \uD654\uBA74\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
const KO_DESCRIPTION =
  "\uC77C\uC2DC\uC801\uC778 \uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.";
const KO_RETRY_LABEL = "\uB2E4\uC2DC \uC2DC\uB3C4";
const KO_ADMIN_MONITORING_LABEL = "\uAD00\uB9AC\uC790 \uBAA8\uB2C8\uD130\uB9C1";
const KO_INTAKE_LABEL = "\uC811\uC218 \uD398\uC774\uC9C0";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global root error", error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <main className="mx-auto max-w-3xl p-6">
          <Card className="p-6">
            <p className="ui-kicker">System Recovery</p>
            <h1 className="mt-2 ui-page-title">{KO_TITLE}</h1>
            <p className="mt-3 text-sm text-text-muted">{KO_DESCRIPTION}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" onClick={reset}>
                {KO_RETRY_LABEL}
              </Button>
              <Link
                href="/admin/monitoring"
                className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
              >
                {KO_ADMIN_MONITORING_LABEL}
              </Link>
              <Link
                href="/intake"
                className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
              >
                {KO_INTAKE_LABEL}
              </Link>
            </div>
          </Card>
        </main>
      </body>
    </html>
  );
}
