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
          <p className="ui-kicker">진행상황</p>
          <h2 className="mt-2 ui-section-title">접수 진행상황 요약</h2>
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
          <p className="ui-kicker">접수 조회</p>
          <h1 className="ui-page-title">접수 진행상황 확인</h1>
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

      <Card muted className="space-y-3 p-5 sm:p-6">
        <h2 className="ui-section-title">휴대폰 홈 화면에 추가하기</h2>
        <p className="text-sm text-text-muted">
          휴대폰 홈 화면에 추가해두면 접수 진행상황을 편하게 확인할 수 있습니다.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-text">
            <span className="font-semibold text-text-strong">iPhone</span>: 공유 버튼 → 홈 화면에 추가
          </div>
          <div className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-text">
            <span className="font-semibold text-text-strong">Android</span>: 브라우저 메뉴 → 홈 화면에 추가
          </div>
        </div>
      </Card>

      {result ? <TrackingResultCard result={result} /> : null}
    </div>
  );
}
