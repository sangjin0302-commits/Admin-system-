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

      const payload = await response.json();
      if (!response.ok) {
        setTone("error");
        setMessage(payload.error ?? "커뮤니케이션 로그를 저장하지 못했습니다.");
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
            최근 연락 내역, 응답 대기 여부, 다음 연락 예정일을 함께 남겨서 상담 흐름이 끊기지 않게 관리합니다.
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
            다음 연락 예정: {nextContactAt ? formatDateTime(nextContactAt) : "-"}
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
                  <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border border-border-strong bg-white" />
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
                    {item.nextContactAt ? ` · 다음 연락 예정 ${formatDateTime(item.nextContactAt)}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted">아직 저장된 연락 로그가 없습니다. 첫 안내나 자료 요청을 보낸 뒤 바로 기록해 두면 흐름 파악이 쉬워집니다.</p>
            )}
          </div>
        </Card>

        <Card muted className="p-5">
          <p className="ui-kicker">새 연락 로그 추가</p>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
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
              <Field label="다음 연락 예정">
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

            <Field label="상세 메모" hint="고객 반응, 약속한 내용, 다음에 확인할 포인트를 함께 적어두면 좋습니다.">
              <Textarea
                rows={6}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="예: 내일 오후까지 여권 사본과 기존 체류자격 증빙을 보내기로 안내함. 추가로 출입국 민원 이력도 확인 필요."
              />
            </Field>

            <label className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-3 text-sm text-text">
              <input
                type="checkbox"
                checked={needsReply}
                onChange={(event) => setNeedsReply(event.target.checked)}
                className="h-4 w-4 rounded border-line-strong text-primary focus:ring-primary/20"
              />
              고객 답변이나 추가 자료를 기다리는 상태로 표시합니다.
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
