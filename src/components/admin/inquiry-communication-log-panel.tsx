"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StateInline } from "@/components/ui/state-panel";
import { Textarea } from "@/components/ui/textarea";
import { parseClientApiError } from "@/lib/http/client-api";
import { formatDateTime, stringifyDateTimeLocalInput } from "@/lib/utils";
import type {
  InquiryCommunicationChannel,
  InquiryCommunicationLogEntry
} from "@/lib/services/inquiry-service";

const channelLabels: Record<InquiryCommunicationChannel, string> = {
  EMAIL: "이메일",
  PHONE: "전화",
  KAKAO: "카카오톡",
  SMS: "문자",
  VISIT: "대면",
  INTERNAL: "내부 메모"
};

type CommunicationPreset = {
  id: "doc-request" | "consult-confirm" | "quote-followup" | "response-reminder";
  label: string;
  description: string;
};

const communicationPresets: CommunicationPreset[] = [
  {
    id: "doc-request",
    label: "자료 요청",
    description: "누락 자료 확인 요청과 재연락 일정을 함께 기록합니다."
  },
  {
    id: "consult-confirm",
    label: "상담 일정 확정",
    description: "상담 일시 확정과 사전 준비 안내를 기록합니다."
  },
  {
    id: "quote-followup",
    label: "견적 후속 안내",
    description: "견적 확인 요청과 회신 마감 안내를 기록합니다."
  },
  {
    id: "response-reminder",
    label: "회신 재요청",
    description: "응답 대기 건에 대한 리마인드를 빠르게 남깁니다."
  }
];

export function InquiryCommunicationLogPanel({
  inquiryId,
  logs,
  latestContactAt,
  latestContactChannel,
  latestContactSummary,
  nextContactAt,
  responsePending,
  suggestedChecklist
}: {
  inquiryId: string;
  logs: InquiryCommunicationLogEntry[];
  latestContactAt?: string | null;
  latestContactChannel?: string | null;
  latestContactSummary?: string | null;
  nextContactAt?: string | null;
  responsePending: boolean;
  suggestedChecklist: string[];
}) {
  const router = useRouter();
  const [channel, setChannel] = useState<InquiryCommunicationChannel>("KAKAO");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [needsReply, setNeedsReply] = useState(responsePending);
  const [nextContactValue, setNextContactValue] = useState(stringifyDateTimeLocalInput(nextContactAt));
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "success" | "error">("default");
  const [isPending, startTransition] = useTransition();

  const timeline = useMemo(() => logs.slice(0, 8), [logs]);
  const checklistSnippet = useMemo(
    () =>
      suggestedChecklist.length > 0
        ? suggestedChecklist
            .slice(0, 3)
            .map((item, index) => `${index + 1}. ${item}`)
            .join("\n")
        : "",
    [suggestedChecklist]
  );

  function getNextContactValue(hoursFromNow: number) {
    const date = new Date();
    date.setHours(date.getHours() + hoursFromNow);
    date.setMinutes(0, 0, 0);
    return stringifyDateTimeLocalInput(date);
  }

  function applyCommunicationPreset(presetId: CommunicationPreset["id"]) {
    setMessage("");

    if (presetId === "doc-request") {
      setChannel("KAKAO");
      setSummary("보완 자료 요청 및 제출 일정 안내");
      setDetails(
        [
          "요청 자료와 제출 일정(다음 연락 기준)을 안내했습니다.",
          checklistSnippet ? `우선 확인 자료\n${checklistSnippet}` : "우선 확인 자료 목록을 함께 전달했습니다."
        ].join("\n\n")
      );
      setNeedsReply(true);
      setNextContactValue(getNextContactValue(24));
      return;
    }

    if (presetId === "consult-confirm") {
      setChannel("PHONE");
      setSummary("상담 일정 확정 및 사전 준비 안내");
      setDetails(
        [
          "상담 일정/연락 채널을 확정했습니다.",
          checklistSnippet ? `상담 전 준비 요청 항목\n${checklistSnippet}` : "상담 전에 필요한 기본 자료를 안내했습니다."
        ].join("\n\n")
      );
      setNeedsReply(false);
      setNextContactValue(getNextContactValue(48));
      return;
    }

    if (presetId === "quote-followup") {
      setChannel("EMAIL");
      setSummary("견적 안내 후 확인 요청");
      setDetails("견적 주요 항목을 안내했고 확인 회신 및 보완 문의 수신 경로를 전달했습니다.");
      setNeedsReply(true);
      setNextContactValue(getNextContactValue(48));
      return;
    }

    setChannel("KAKAO");
    setSummary("회신 재요청 및 다음 연락 예고");
    setDetails("응답 대기 상태를 안내하고 다음 연락 예정 시점을 공유했습니다.");
    setNeedsReply(true);
    setNextContactValue(getNextContactValue(24));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/communication-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          channel,
          summary,
          details,
          responsePending: needsReply,
          nextContactAt: nextContactValue || undefined
        })
      });

      if (!response.ok) {
        setTone("error");
        setMessage(await parseClientApiError(response, "커뮤니케이션 로그를 저장하지 못했습니다."));
        return;
      }

      setTone("success");
      setMessage("커뮤니케이션 로그를 저장했습니다.");
      setSummary("");
      setDetails("");
      router.refresh();
    });
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="ui-section-title">고객 커뮤니케이션 로그</h3>
          <p className="mt-2 text-sm text-text-muted">
            최근 연락 이력, 응답 대기 여부, 다음 연락 일정을 함께 관리해서 상담 흐름이 끊기지 않도록 정리합니다.
          </p>
        </div>
        <Card muted className="p-4 lg:min-w-[260px]">
          <p className="ui-kicker">현재 연락 상태</p>
          <p className="mt-2 text-sm font-semibold text-text-strong">
            {latestContactAt ? formatDateTime(latestContactAt) : "아직 기록 없음"}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            최근 채널: {latestContactChannel ? channelLabels[latestContactChannel as InquiryCommunicationChannel] ?? latestContactChannel : "-"}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            응답 대기: {responsePending ? "예" : "아니오"}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            다음 연락 일정: {nextContactAt ? formatDateTime(nextContactAt) : "-"}
          </p>
          {latestContactSummary ? <p className="mt-3 text-sm text-text">{latestContactSummary}</p> : null}
        </Card>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card muted className="p-5">
          <p className="ui-kicker">최근 연락 타임라인</p>
          <div className="mt-4 space-y-4">
            {timeline.length > 0 ? (
              timeline.map((item, index) => (
                <div key={item.id} className="relative pl-6">
                  {index < timeline.length - 1 ? (
                    <span className="absolute left-[7px] top-5 h-[calc(100%+8px)] w-px bg-border/70" />
                  ) : null}
                  <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border border-line-strong bg-white" />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-text-strong">{item.summary}</p>
                    <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted">
                      {channelLabels[item.channel]}
                    </span>
                    {item.responsePending ? (
                      <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs text-warning">
                        응답 대기
                      </span>
                    ) : null}
                  </div>
                  {item.details ? <p className="mt-1 whitespace-pre-line text-sm text-text-muted">{item.details}</p> : null}
                  <p className="mt-1 text-xs text-text-muted">
                    기록 시점: {formatDateTime(item.createdAt)}
                    {item.nextContactAt ? ` / 다음 연락 일정 ${formatDateTime(item.nextContactAt)}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted">아직 등록된 연락 로그가 없습니다. 초기 안내나 자료 요청을 보낸 뒤 바로 기록해 두면 다음 대응이 훨씬 수월해집니다.</p>
            )}
          </div>
        </Card>

        <Card muted className="p-5">
          <p className="ui-kicker">새 연락 로그 추가</p>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <Card className="p-4">
              <p className="ui-kicker">원클릭 실행 프리셋</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {communicationPresets.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => applyCommunicationPreset(preset.id)}
                    disabled={isPending}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="mt-3 space-y-1 text-xs text-text-muted">
                {communicationPresets.map((preset) => (
                  <p key={`preset-desc-${preset.id}`}>
                    • {preset.label}: {preset.description}
                  </p>
                ))}
              </div>
            </Card>

            <FieldGroup className="md:grid-cols-2">
              <Field label="연락 채널">
                <Select value={channel} onChange={(event) => setChannel(event.target.value as InquiryCommunicationChannel)}>
                  {Object.entries(channelLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="다음 연락 일정">
                <Input
                  type="datetime-local"
                  value={nextContactValue}
                  onChange={(event) => setNextContactValue(event.target.value)}
                />
              </Field>
            </FieldGroup>

            <Field label="연락 요약">
              <Input
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="예: 보완 서류 3종 요청, 상담 일정 조율, 견적 발송 안내"
              />
            </Field>

            <Field label="상세 메모" hint="고객 반응, 약속한 내용, 다음에 확인할 사항을 함께 적어두면 좋습니다.">
              <Textarea
                rows={6}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="예: 내일 오후까지 기존 체류자격 증빙을 보내기로 안내함. 추가로 출입국 민원 이력 확인이 필요함."
              />
            </Field>

            <label className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-3 text-sm text-text">
              <input
                type="checkbox"
                checked={needsReply}
                onChange={(event) => setNeedsReply(event.target.checked)}
                className="h-4 w-4 rounded border-line-strong text-primary focus:ring-primary/20"
              />
              고객 응답이나 추가 자료를 기다리는 상태로 표시합니다.
            </label>

            {suggestedChecklist.length > 0 ? (
              <Card className="p-4">
                <p className="ui-kicker">지금 같이 확인하면 좋은 항목</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text">
                  {suggestedChecklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {message ? <StateInline tone={tone}>{message}</StateInline> : null}

            <Button type="submit" disabled={isPending} fullWidth>
              {isPending ? "저장 중..." : "커뮤니케이션 로그 저장"}
            </Button>
          </form>
        </Card>
      </div>
    </Card>
  );
}

