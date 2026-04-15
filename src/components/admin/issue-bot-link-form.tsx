"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { issueBotCatalog } from "@/lib/issue-bots/catalog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StateInline } from "@/components/ui/state-panel";
import { Textarea } from "@/components/ui/textarea";

type ExistingLink = {
  id: string;
  botKey: string;
  botLabel: string;
  status: string;
  connectionNotes: string | null;
  externalThreadId: string | null;
  updatedAt: string | Date;
};

export function IssueBotLinkForm({
  inquiryId,
  links
}: {
  inquiryId: string;
  links: ExistingLink[];
}) {
  const router = useRouter();
  const [botKey, setBotKey] = useState<string>(issueBotCatalog[0]?.key ?? "");
  const [connectionNotes, setConnectionNotes] = useState("");
  const [externalThreadId, setExternalThreadId] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "error" | "success">("default");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/issue-bots`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          botKey,
          connectionNotes,
          externalThreadId
        })
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setTone("error");
        setMessage(data.error ?? "쟁점 봇 연결을 저장하지 못했습니다.");
        return;
      }

      setTone("success");
      setMessage("쟁점 봇 연결 슬롯을 저장했습니다.");
      setConnectionNotes("");
      setExternalThreadId("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Card muted className="p-5">
        <p className="ui-kicker">Issue Bot Slots</p>
        <h3 className="mt-2 text-base font-semibold text-text-strong">쟁점 봇 연결</h3>
        <p className="ui-section-copy mt-2">
          실제 봇 연동 전 단계에서 이 문의를 어떤 쟁점 봇과 연결할지 미리 지정하고 메모를 남길 수 있습니다.
        </p>
      </Card>

      {links.length > 0 ? (
        <div className="grid gap-3">
          {links.map((link) => (
            <Card key={link.id} muted className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-text-strong">{link.botLabel}</p>
                  <span className="ui-toolbar-button cursor-default">{link.status}</span>
                </div>
                <p className="text-xs text-text-muted">봇 키: {link.botKey}</p>
                {link.externalThreadId ? (
                  <p className="text-xs text-text-muted">외부 스레드 ID: {link.externalThreadId}</p>
                ) : null}
                {link.connectionNotes ? (
                  <p className="text-sm text-text">{link.connectionNotes}</p>
                ) : (
                  <p className="text-sm text-text-muted">아직 연결 메모가 없습니다.</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card muted className="p-4">
          <p className="text-sm text-text-muted">
            아직 연결된 쟁점 봇이 없습니다. 아래에서 슬롯을 먼저 저장해 두면 나중에 실제 봇을 붙이기 쉽습니다.
          </p>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldGroup>
          <Field label="쟁점 봇">
            <Select value={botKey} onChange={(event) => setBotKey(event.target.value)}>
              {issueBotCatalog.map((bot) => (
                <option key={bot.key} value={bot.key}>
                  {bot.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="외부 스레드 ID">
            <Input
              value={externalThreadId}
              onChange={(event) => setExternalThreadId(event.target.value)}
              placeholder="나중에 텔레그램/외부 봇 스레드 ID를 연결할 수 있습니다."
            />
          </Field>
          <Field label="연결 메모" className="sm:col-span-2">
            <Textarea
              rows={4}
              value={connectionNotes}
              onChange={(event) => setConnectionNotes(event.target.value)}
              placeholder="예: 비자 리스크 정리용, 1차 쟁점 추출 후 상태 공유 예정"
            />
          </Field>
        </FieldGroup>
        {message ? <StateInline tone={tone}>{message}</StateInline> : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? "저장 중..." : "쟁점 봇 연결 저장"}
        </Button>
      </form>
    </div>
  );
}
