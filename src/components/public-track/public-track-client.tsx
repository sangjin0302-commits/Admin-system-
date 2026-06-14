"use client";

import { useMemo, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StateInline } from "@/components/ui/state-panel";
import {
  buildPublicTrackViewModel,
  isPublicTrackLookupReady,
  normalizePublicTrackCodeInput,
  normalizePublicTrackPhoneLast4Input,
  PUBLIC_TRACK_API_PATH,
  PUBLIC_TRACK_GENERIC_NOT_FOUND_MESSAGE,
  type PublicTrackViewModel
} from "@/lib/services/public-track-page-ui-model";

const LOOKUP_ERROR_MESSAGE = PUBLIC_TRACK_GENERIC_NOT_FOUND_MESSAGE;
const HOME_SCREEN_TITLE = "\uD734\uB300\uD3F0 \uD648 \uD654\uBA74\uC5D0 \uCD94\uAC00\uD558\uAE30";
const HOME_SCREEN_DESCRIPTION =
  "\uD648 \uD654\uBA74\uC5D0 \uCD94\uAC00\uD558\uBA74 \uC811\uC218 \uC9C4\uD589\uC0C1\uD669\uC744 \uC571\uCC98\uB7FC \uBE60\uB974\uAC8C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
const IOS_HOME_SCREEN_GUIDE =
  "iPhone: \uACF5\uC720 \uBC84\uD2BC\uC744 \uB204\uB978 \uB4A4 \u201C\uD648 \uD654\uBA74\uC5D0 \uCD94\uAC00\u201D\uB97C \uC120\uD0DD\uD558\uC138\uC694.";
const ANDROID_HOME_SCREEN_GUIDE =
  "Android: \uBE0C\uB77C\uC6B0\uC800 \uBA54\uB274\uB97C \uB204\uB978 \uB4A4 \u201C\uD648 \uD654\uBA74\uC5D0 \uCD94\uAC00\u201D\uB97C \uC120\uD0DD\uD558\uC138\uC694.";

function ResultRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div className="rounded-md border border-line bg-surface px-4 py-3">
      <dt className="text-xs font-semibold text-text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-text-strong">{value}</dd>
    </div>
  );
}

function TrackingResultCard({ result }: { result: PublicTrackViewModel }) {
  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="ethos-eyebrow">Status</p>
          <h2 className="ethos-display mt-2 text-xl">접수 진행상황 요약</h2>
        </div>
        <Badge>{result.customerStatusLabel}</Badge>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <ResultRow label="접수번호" value={result.trackingCode} />
        <ResultRow label="업무 분야" value={result.categoryLabel} />
        <ResultRow label="세부 유형" value={result.categoryDetailLabel} />
        <ResultRow label="접수일" value={result.receivedAtLabel} />
        <ResultRow label="최근 업데이트" value={result.lastUpdatedAtLabel} />
        <ResultRow label="현재 상태" value={result.customerStatusLabel} />
      </dl>

      <div className="rounded-md border border-line bg-surface-muted p-4">
        <p className="text-sm font-semibold text-text-strong">안내 메시지</p>
        <p className="mt-2 text-sm text-text">{result.message}</p>
        <p className="mt-4 text-sm font-semibold text-text-strong">다음 단계</p>
        <p className="mt-2 text-sm text-text">{result.nextStepLabel}</p>
      </div>
    </Card>
  );
}

export function PublicTrackClient() {
  const [trackingCode, setTrackingCode] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [result, setResult] = useState<PublicTrackViewModel | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const lookupReady = useMemo(
    () => isPublicTrackLookupReady({ trackingCode, phoneLast4 }),
    [trackingCode, phoneLast4]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedTrackingCode = normalizePublicTrackCodeInput(trackingCode);
    const normalizedPhoneLast4 = normalizePublicTrackPhoneLast4Input(phoneLast4);
    setTrackingCode(normalizedTrackingCode);
    setPhoneLast4(normalizedPhoneLast4);

    if (!isPublicTrackLookupReady({ trackingCode: normalizedTrackingCode, phoneLast4: normalizedPhoneLast4 })) {
      setResult(null);
      setError("접수번호와 휴대폰 뒤 4자리를 입력해 주세요.");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(PUBLIC_TRACK_API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingCode: normalizedTrackingCode,
          phoneLast4: normalizedPhoneLast4
        })
      });

      if (!response.ok) {
        setError(LOOKUP_ERROR_MESSAGE);
        return;
      }

      const data = await response.json().catch(() => null);
      const viewModel = buildPublicTrackViewModel(data);
      if (!viewModel) {
        setError(LOOKUP_ERROR_MESSAGE);
        return;
      }

      setResult(viewModel);
    } catch {
      setError(LOOKUP_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card className="space-y-5 p-5 sm:p-6">
        <div className="space-y-2">
          <p className="ethos-eyebrow">Track Your Case</p>
          <h1 className="ethos-display text-3xl">접수 진행상황 확인</h1>
          <p className="text-sm text-text-muted">
            이 화면은 고객용 진행상황 요약만 제공합니다. 자세한 상담 내용은 담당자 연락을 통해 확인해 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="trackingCode" className="text-sm font-semibold text-text-strong">
              접수번호
            </label>
            <Input
              id="trackingCode"
              name="trackingCode"
              value={trackingCode}
              onChange={(event) => setTrackingCode(event.target.value.toUpperCase())}
              onBlur={() => setTrackingCode((value) => normalizePublicTrackCodeInput(value))}
              placeholder="예: 20260504-FC-0002-7D"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phoneLast4" className="text-sm font-semibold text-text-strong">
              휴대폰 뒤 4자리
            </label>
            <Input
              id="phoneLast4"
              name="phoneLast4"
              value={phoneLast4}
              onChange={(event) =>
                setPhoneLast4(normalizePublicTrackPhoneLast4Input(event.target.value))
              }
              placeholder="예: 1234"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>

          {error ? <StateInline tone="error">{error}</StateInline> : null}

          <Button type="submit" size="lg" fullWidth disabled={!lookupReady || isLoading}>
            {isLoading ? "조회 중" : "진행상황 조회"}
          </Button>
        </form>
      </Card>

      {result ? <TrackingResultCard result={result} /> : null}

      <Card muted className="p-4 sm:p-5">
        <details className="group">
          <summary className="cursor-pointer list-none text-sm font-semibold text-text-strong">
            {HOME_SCREEN_TITLE}
          </summary>
          <div className="mt-3 space-y-3">
            <p className="text-sm text-text-muted">{HOME_SCREEN_DESCRIPTION}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-text">
                {IOS_HOME_SCREEN_GUIDE}
              </div>
              <div className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-text">
                {ANDROID_HOME_SCREEN_GUIDE}
              </div>
            </div>
          </div>
        </details>
      </Card>
    </div>
  );
}
