"use client";

import Link from "next/link";

import type { IntakeCategoryDisplayLocale } from "@/types/intake-category";

import type { IntakeFormCopy } from "../intake-types";

export function IntakeStepSuccess({
  copy,
  locale,
  completedMessage,
  completedTrackingCode
}: {
  copy: IntakeFormCopy;
  locale: IntakeCategoryDisplayLocale;
  completedMessage: string;
  completedTrackingCode: string;
}) {
  if (!completedMessage) return null;
  return (
    <section className="rounded-md border border-line bg-surface-muted p-5">
      <p className="ui-kicker">{copy.completeKicker}</p>
      <p className="mt-2 text-base font-semibold text-text-strong">{completedMessage}</p>
      {completedTrackingCode ? (
        <>
          <p className="mt-3 text-sm text-text">
            {copy.trackingNumber}:{" "}
            <span className="font-semibold text-text-strong">{completedTrackingCode}</span>
          </p>
          <p className="mt-2 text-sm text-text-muted">{copy.trackingHelp}</p>
          <Link
            href="/track"
            className="mt-4 inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
          >
            {locale === "en" ? "Check request status" : "접수 진행상황 확인하기"}
          </Link>
        </>
      ) : null}
    </section>
  );
}
