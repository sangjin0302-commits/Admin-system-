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
        setMessage(payload.error ?? "而ㅻ??덉??댁뀡 濡쒓렇瑜???ν븯吏 紐삵뻽?듬땲??");
        return;
      }

      setTone("success");
      setMessage("而ㅻ??덉??댁뀡 濡쒓렇瑜???ν뻽?듬땲??");
      setSummary("");
      setDetails("");
      router.refresh();
    });
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="ui-section-title">怨좉컼 而ㅻ??덉??댁뀡 濡쒓렇</h3>
          <p className="mt-2 text-sm text-text-muted">
            理쒓렐 ?곕씫 ?댁뿭, ?묐떟 ?湲??щ?, ?ㅼ쓬 ?곕씫 ?덉젙?쇱쓣 ?④퍡 ?④꺼???곷떞 ?먮쫫???딄린吏 ?딄쾶 愿由ы빀?덈떎.
          </p>
        </div>
        <Card muted className="p-4 lg:min-w-[260px]">
          <p className="ui-kicker">?꾩옱 ?곕씫 ?곹깭</p>
          <p className="mt-2 text-sm font-semibold text-text-strong">
            {latestContactAt ? formatDateTime(latestContactAt) : "?꾩쭅 湲곕줉 ?놁쓬"}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            理쒓렐 梨꾨꼸: {latestContactChannel ? channelLabels[latestContactChannel as InquiryCommunicationChannel] ?? latestContactChannel : "-"}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            응답 대기: {responsePending ? "예" : "아니오"}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            ?ㅼ쓬 ?곕씫 ?덉젙: {nextContactAt ? formatDateTime(nextContactAt) : "-"}
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
                        ?묐떟 ?湲?
                      </span>
                    ) : null}
                  </div>
                  {item.details ? <p className="mt-1 whitespace-pre-line text-sm text-text-muted">{item.details}</p> : null}
                  <p className="mt-1 text-xs text-text-muted">
                    湲곕줉 ?쒖젏: {formatDateTime(item.createdAt)}
                    {item.nextContactAt ? ` / ?ㅼ쓬 ?곕씫 ?덉젙 ${formatDateTime(item.nextContactAt)}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted">?꾩쭅 ??λ맂 ?곕씫 濡쒓렇媛 ?놁뒿?덈떎. 泥??덈궡???먮즺 ?붿껌??蹂대궦 ??諛붾줈 湲곕줉???먮㈃ ?먮쫫 ?뚯븙???ъ썙吏묐땲??</p>
            )}
          </div>
        </Card>

        <Card muted className="p-5">
          <p className="ui-kicker">???곕씫 濡쒓렇 異붽?</p>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <FieldGroup className="md:grid-cols-2">
              <Field label="?곕씫 梨꾨꼸">
                <Select value={channel} onChange={(event) => setChannel(event.target.value as InquiryCommunicationChannel)}>
                  {Object.entries(channelLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="?ㅼ쓬 ?곕씫 ?덉젙">
                <Input
                  type="datetime-local"
                  value={nextContactValue}
                  onChange={(event) => setNextContactValue(event.target.value)}
                />
              </Field>
            </FieldGroup>

            <Field label="?곕씫 ?붿빟">
              <Input
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="?? 蹂댁셿 ?쒕쪟 3醫??붿껌, ?곷떞 ?쇱젙 議곗쑉, 寃ъ쟻 諛쒖넚 ?덈궡"
              />
            </Field>

            <Field label="?곸꽭 硫붾え" hint="怨좉컼 諛섏쓳, ?쎌냽???댁슜, ?ㅼ쓬???뺤씤???ъ씤?몃? ?④퍡 ?곸뼱?먮㈃ 醫뗭뒿?덈떎.">
              <Textarea
                rows={6}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="?? ?댁씪 ?ㅽ썑源뚯? ?ш텒 ?щ낯怨?湲곗〈 泥대쪟?먭꺽 利앸튃??蹂대궡湲곕줈 ?덈궡?? 異붽?濡?異쒖엯援?誘쇱썝 ?대젰???뺤씤 ?꾩슂."
              />
            </Field>

            <label className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-3 text-sm text-text">
              <input
                type="checkbox"
                checked={needsReply}
                onChange={(event) => setNeedsReply(event.target.checked)}
                className="h-4 w-4 rounded border-line-strong text-primary focus:ring-primary/20"
              />
              怨좉컼 ?듬??대굹 異붽? ?먮즺瑜?湲곕떎由щ뒗 ?곹깭濡??쒖떆?⑸땲??
            </label>

            {suggestedChecklist.length > 0 ? (
              <Card className="p-4">
                <p className="ui-kicker">吏湲?媛숈씠 ?뺤씤?섎㈃ 醫뗭? ??ぉ</p>
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

