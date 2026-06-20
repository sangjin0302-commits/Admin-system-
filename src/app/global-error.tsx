"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { logger } from "@/lib/utils/logger";

const KO_TITLE = "\uC77C\uC2DC\uC801\uC778 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4";
const KO_DESCRIPTION =
  "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694. \uACC4\uC18D \uBC1C\uC0DD\uD560 \uACBD\uC6B0 \uC0AC\uBB34\uC18C\uC5D0 \uC54C\uB824\uC8FC\uC2DC\uBA74 \uBE60\uB974\uAC8C \uD655\uC778\uD558\uACA0\uC2B5\uB2C8\uB2E4.";
const KO_RETRY_LABEL = "\uB2E4\uC2DC \uC2DC\uB3C4";
const KO_ADMIN_MONITORING_LABEL = "\uAD00\uB9AC\uC790 \uBAA8\uB2C8\uD130\uB9C1";
const KO_INTAKE_LABEL = "\uC0C1\uB2F4 \uC2E0\uCCAD";
const KO_HOME_LABEL = "\uD648\uC73C\uB85C";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Global root error", error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <main className="mx-auto max-w-3xl p-6">
          <Card className="p-8 text-center">
            <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">500 · Internal Error</p>
            <h1 className="mt-3 font-serif text-5xl font-bold text-primary sm:text-6xl">500</h1>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="h-px w-12 bg-gold" />
              <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
              <span className="h-px w-12 bg-gold" />
            </div>
            <h2 className="mt-6 font-serif text-xl font-bold text-primary">{KO_TITLE}</h2>
            <p className="mt-3 text-sm leading-7 text-text-muted">{KO_DESCRIPTION}</p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs text-gold-deep">오류 ID: {error.digest}</p>
            )}
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={reset}>
                {KO_RETRY_LABEL}
              </Button>
              <Link
                href="/"
                className="inline-flex h-10 items-center rounded-md border-2 border-gold/40 bg-surface px-4 text-sm font-semibold text-primary transition hover:bg-gold-soft/30"
              >
                {KO_HOME_LABEL}
              </Link>
              <Link
                href="/intake"
                className="inline-flex h-10 items-center rounded-md border-2 border-gold/40 bg-surface px-4 text-sm font-semibold text-primary transition hover:bg-gold-soft/30"
              >
                {KO_INTAKE_LABEL}
              </Link>
              <Link
                href="/admin/monitoring"
                className="inline-flex h-10 items-center rounded-md border border-line bg-surface px-4 text-xs text-text-muted transition hover:bg-surface-muted"
              >
                {KO_ADMIN_MONITORING_LABEL}
              </Link>
            </div>
          </Card>
        </main>
      </body>
    </html>
  );
}
