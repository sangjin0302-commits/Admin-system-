"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StateInline } from "@/components/ui/state-panel";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  inquiryStatusLabels,
  inquiryStatusValues,
  type InquiryStatus
} from "@/types/inquiry";

export function InquiryManagementForm({
  inquiryId,
  status: initialStatus,
  assignee: initialAssignee,
  internalMemo: initialInternalMemo
}: {
  inquiryId: string;
  status: InquiryStatus;
  assignee: string | null;
  internalMemo: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [assignee, setAssignee] = useState(initialAssignee ?? "");
  const [internalMemo, setInternalMemo] = useState(initialInternalMemo ?? "");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"default" | "error" | "success">("default");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          assignee,
          internalMemo
        })
      });

      if (!response.ok) {
        setMessageTone("error");
        setMessage("저장 중 오류가 발생했습니다.");
        return;
      }

      setMessageTone("success");
      setMessage("관리 정보가 저장되었습니다.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldGroup>
        <Field label="상태">
          <Select value={status} onChange={(event) => setStatus(event.target.value as InquiryStatus)}>
            {inquiryStatusValues.map((value) => (
              <option key={value} value={value}>
                {inquiryStatusLabels[value].ko}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="담당자">
          <Input
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
            placeholder="예: 김행정 / 운영담당"
          />
        </Field>
        <Field label="내부 메모" hint="고객에게 보이지 않는 관리자 메모입니다.">
          <Textarea
            rows={8}
            value={internalMemo}
            onChange={(event) => setInternalMemo(event.target.value)}
            placeholder="상담 인상, 우선 확인사항, 견적 전 체크 내용 등을 기록합니다."
          />
        </Field>
      </FieldGroup>
      {message ? <StateInline tone={messageTone}>{message}</StateInline> : null}
      <Button type="submit" disabled={isPending} fullWidth>
        {isPending ? "저장 중..." : "관리 정보 저장"}
      </Button>
    </form>
  );
}
