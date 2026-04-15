"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState, StateInline } from "@/components/ui/state-panel";
import { Textarea } from "@/components/ui/textarea";
import type { ClientRelationshipWorkspace } from "@/lib/services/client-relationship-service";
import {
  clientRelationshipStatusLabels,
  clientRelationshipStatusValues,
  followUpActionStatusLabels,
  followUpActionStatusValues,
  followUpActionTypeLabels,
  followUpActionTypeValues,
  type ClientRelationshipStatus,
  type FollowUpActionStatus,
  type FollowUpActionType
} from "@/types/case";

type ClientRelationshipPanelProps = {
  initialWorkspace: ClientRelationshipWorkspace | null;
};

function dateInputValue(value?: string | null) {
  return value?.slice(0, 10) ?? "";
}

export function ClientRelationshipPanel({ initialWorkspace }: ClientRelationshipPanelProps) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "success" | "error">("default");
  const [isPending, startTransition] = useTransition();
  const [closedAt, setClosedAt] = useState(dateInputValue(initialWorkspace?.closure.closedAt));
  const [closeReason, setCloseReason] = useState(initialWorkspace?.closure.closeReason ?? "");
  const [outcomeSummary, setOutcomeSummary] = useState(initialWorkspace?.closure.outcomeSummary ?? "");
  const [nextFollowUpDate, setNextFollowUpDate] = useState(
    dateInputValue(initialWorkspace?.closure.nextFollowUpDate)
  );
  const [relationshipStatus, setRelationshipStatus] = useState<ClientRelationshipStatus>(
    initialWorkspace?.relationship.clientRelationshipStatus ?? "NEUTRAL"
  );
  const [reviewRequested, setReviewRequested] = useState(
    initialWorkspace?.relationship.reviewRequested ?? false
  );
  const [reviewCompleted, setReviewCompleted] = useState(
    initialWorkspace?.relationship.reviewCompleted ?? false
  );
  const [referralEligible, setReferralEligible] = useState(
    initialWorkspace?.relationship.referralEligible ?? false
  );
  const [reengagementEligible, setReengagementEligible] = useState(
    initialWorkspace?.relationship.reengagementEligible ?? false
  );
  const [lastFollowUpAt, setLastFollowUpAt] = useState(
    dateInputValue(initialWorkspace?.relationship.lastFollowUpAt)
  );
  const [newActionType, setNewActionType] = useState<FollowUpActionType>("REVIEW_REQUEST");
  const [newActionDueDate, setNewActionDueDate] = useState("");
  const [newActionNote, setNewActionNote] = useState("");

  useEffect(() => {
    setWorkspace(initialWorkspace);
    setClosedAt(dateInputValue(initialWorkspace?.closure.closedAt));
    setCloseReason(initialWorkspace?.closure.closeReason ?? "");
    setOutcomeSummary(initialWorkspace?.closure.outcomeSummary ?? "");
    setNextFollowUpDate(dateInputValue(initialWorkspace?.closure.nextFollowUpDate));
    setRelationshipStatus(initialWorkspace?.relationship.clientRelationshipStatus ?? "NEUTRAL");
    setReviewRequested(initialWorkspace?.relationship.reviewRequested ?? false);
    setReviewCompleted(initialWorkspace?.relationship.reviewCompleted ?? false);
    setReferralEligible(initialWorkspace?.relationship.referralEligible ?? false);
    setReengagementEligible(initialWorkspace?.relationship.reengagementEligible ?? false);
    setLastFollowUpAt(dateInputValue(initialWorkspace?.relationship.lastFollowUpAt));
  }, [initialWorkspace]);

  function setFeedback(nextMessage: string, nextTone: "default" | "success" | "error") {
    setMessage(nextMessage);
    setTone(nextTone);
  }

  async function saveRelationship() {
    if (!workspace) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/cases/${workspace.caseId}/relationship`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage: workspace.currentStage,
            closedAt,
            closeReason,
            outcomeSummary,
            nextFollowUpDate,
            clientRelationshipStatus: relationshipStatus,
            reviewRequested,
            reviewCompleted,
            referralEligible,
            reengagementEligible,
            lastFollowUpAt
          })
        });
        const payload = await response.json();
        if (!response.ok) {
          setFeedback(payload.error ?? "관계 상태를 저장하지 못했습니다.", "error");
          return;
        }

        setWorkspace(payload.relationshipWorkspace);
        setFeedback("종결 및 고객 관계 상태를 저장했습니다.", "success");
      } catch {
        setFeedback("관계 상태 저장 중 오류가 발생했습니다.", "error");
      }
    });
  }

  async function createFollowUpAction() {
    if (!workspace) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/cases/${workspace.caseId}/follow-ups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: newActionType,
            dueDate: newActionDueDate,
            note: newActionNote
          })
        });
        const payload = await response.json();
        if (!response.ok) {
          setFeedback(payload.error ?? "후속조치를 생성하지 못했습니다.", "error");
          return;
        }

        setWorkspace(payload.caseWorkspace);
        setNewActionNote("");
        setNewActionDueDate("");
        setFeedback("후속조치를 생성했습니다.", "success");
      } catch {
        setFeedback("후속조치 생성 중 오류가 발생했습니다.", "error");
      }
    });
  }

  async function updateAction(
    actionId: string,
    payload: { status?: FollowUpActionStatus; note?: string; dueDate?: string }
  ) {
    if (!workspace) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/cases/${workspace.caseId}/follow-ups/${actionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
          setFeedback(data.error ?? "후속조치를 업데이트하지 못했습니다.", "error");
          return;
        }

        setWorkspace(data.caseWorkspace);
        setFeedback("후속조치를 업데이트했습니다.", "success");
      } catch {
        setFeedback("후속조치 업데이트 중 오류가 발생했습니다.", "error");
      }
    });
  }

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(`${label} 문구를 복사했습니다.`, "success");
    } catch {
      setFeedback("클립보드 복사에 실패했습니다.", "error");
    }
  }

  if (!workspace) {
    return (
      <Card className="p-6">
        <h3 className="ui-section-title">종결 후 관계 관리</h3>
        <EmptyState
          title="아직 사건 종결 관리 대상이 없습니다."
          description="사건이 생성된 뒤 종결 처리와 후기/추천/재의뢰 관리를 이어서 기록할 수 있습니다."
          className="mt-4"
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="ui-section-title">종결 처리와 고객 관계</h3>
        <div className="ui-section-copy mt-4 grid gap-3 sm:grid-cols-2">
          <p>사건번호: {workspace.caseNumber}</p>
          <p>관계 상태: {clientRelationshipStatusLabels[workspace.relationship.clientRelationshipStatus]}</p>
        </div>
        <div className="mt-5">
          <FieldGroup>
            <Field label="종결일">
              <Input type="date" value={closedAt} onChange={(event) => setClosedAt(event.target.value)} />
            </Field>
            <Field label="후속 예정일">
              <Input
                type="date"
                value={nextFollowUpDate}
                onChange={(event) => setNextFollowUpDate(event.target.value)}
              />
            </Field>
            <Field label="관계 상태">
              <Select
                value={relationshipStatus}
                onChange={(event) => setRelationshipStatus(event.target.value as ClientRelationshipStatus)}
              >
                {clientRelationshipStatusValues.map((value) => (
                  <option key={value} value={value}>
                    {clientRelationshipStatusLabels[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="마지막 후속일">
              <Input
                type="date"
                value={lastFollowUpAt}
                onChange={(event) => setLastFollowUpAt(event.target.value)}
              />
            </Field>
            <Field label="종결 사유">
              <Input value={closeReason} onChange={(event) => setCloseReason(event.target.value)} />
            </Field>
            <Field label="종결 요약">
              <Textarea
                rows={4}
                value={outcomeSummary}
                onChange={(event) => setOutcomeSummary(event.target.value)}
              />
            </Field>
          </FieldGroup>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <ToggleCard
              label="후기 요청 여부"
              checked={reviewRequested}
              onChange={setReviewRequested}
            />
            <ToggleCard
              label="후기 완료 여부"
              checked={reviewCompleted}
              onChange={setReviewCompleted}
            />
            <ToggleCard
              label="추천 가능 고객"
              checked={referralEligible}
              onChange={setReferralEligible}
            />
            <ToggleCard
              label="재의뢰 가능 고객"
              checked={reengagementEligible}
              onChange={setReengagementEligible}
            />
          </div>
          <div className="mt-4">
            <Button onClick={saveRelationship} disabled={isPending}>
              {isPending ? "저장 중.." : "종결/관계 상태 저장"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="ui-section-title">후기/추천/재의뢰 후속조치</h3>
        <div className="mt-4">
          <FieldGroup>
            <Field label="후속 유형">
              <Select
                value={newActionType}
                onChange={(event) => setNewActionType(event.target.value as FollowUpActionType)}
              >
                {followUpActionTypeValues.map((value) => (
                  <option key={value} value={value}>
                    {followUpActionTypeLabels[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="예정일">
              <Input
                type="date"
                value={newActionDueDate}
                onChange={(event) => setNewActionDueDate(event.target.value)}
              />
            </Field>
            <Field label="메모">
              <Textarea
                rows={3}
                value={newActionNote}
                onChange={(event) => setNewActionNote(event.target.value)}
              />
            </Field>
          </FieldGroup>
          <div className="mt-4">
            <Button onClick={createFollowUpAction} disabled={isPending}>
              {isPending ? "생성 중.." : "후속조치 생성"}
            </Button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {workspace.followUpActions.length === 0 ? (
            <EmptyState
              title="등록된 후속조치가 없습니다."
              description="사건 종결 후 후기 요청, 추천 확인, 재의뢰 안부를 이 영역에서 관리할 수 있습니다."
            />
          ) : (
            workspace.followUpActions.map((action) => (
              <FollowUpActionCard
                key={action.id}
                action={action}
                disabled={isPending}
                onUpdate={updateAction}
                onCopy={copyText}
              />
            ))
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="ui-section-title">메시지 초안</h3>
        <div className="mt-4 space-y-4">
          <MessageCard
            title="사건 종결 안내"
            text={workspace.messageDrafts.closeNoticeKo}
            onCopy={() => copyText("사건 종결 안내", workspace.messageDrafts.closeNoticeKo)}
          />
          <MessageCard
            title="후기 요청"
            text={workspace.messageDrafts.reviewRequestKo}
            onCopy={() => copyText("후기 요청", workspace.messageDrafts.reviewRequestKo)}
          />
          <MessageCard
            title="추천 요청"
            text={workspace.messageDrafts.referralRequestKo}
            onCopy={() => copyText("추천 요청", workspace.messageDrafts.referralRequestKo)}
          />
          <MessageCard
            title="재의뢰 안부"
            text={workspace.messageDrafts.reengagementKo}
            onCopy={() => copyText("재의뢰 안부", workspace.messageDrafts.reengagementKo)}
          />
        </div>
      </Card>

      {message ? <StateInline tone={tone}>{message}</StateInline> : null}
    </div>
  );
}

function ToggleCard({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="ui-stat-card flex items-center justify-between rounded-md px-3 py-2 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}

function FollowUpActionCard({
  action,
  disabled,
  onUpdate,
  onCopy
}: {
  action: ClientRelationshipWorkspace["followUpActions"][number];
  disabled: boolean;
  onUpdate: (
    actionId: string,
    payload: { status?: FollowUpActionStatus; note?: string; dueDate?: string }
  ) => Promise<void>;
  onCopy: (label: string, value: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<FollowUpActionStatus>(action.status);
  const [note, setNote] = useState(action.note ?? "");
  const [dueDate, setDueDate] = useState(dateInputValue(action.dueDate));

  useEffect(() => {
    setStatus(action.status);
    setNote(action.note ?? "");
    setDueDate(dateInputValue(action.dueDate));
  }, [action]);

  return (
    <Card muted className="ui-stat-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-text-strong">{action.title}</p>
          <p className="mt-1 text-xs text-text-muted">
            {followUpActionTypeLabels[action.type]} / {followUpActionStatusLabels[action.status]}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="ui-toolbar-button"
          onClick={() => onCopy(action.title, action.messageDraft)}
        >
          복사
        </Button>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <Field label="상태">
          <Select value={status} onChange={(event) => setStatus(event.target.value as FollowUpActionStatus)}>
            {followUpActionStatusValues.map((value) => (
              <option key={value} value={value}>
                {followUpActionStatusLabels[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="예정일">
          <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </Field>
      </div>
      <Field label="메모" className="mt-2">
        <Textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </Field>
      <pre className="mt-3 whitespace-pre-wrap rounded-md border border-line bg-surface px-3 py-3 text-sm text-text">
        {action.messageDraft}
      </pre>
      <div className="mt-3">
        <Button
          size="sm"
          variant="secondary"
          disabled={disabled}
          onClick={() => onUpdate(action.id, { status, note, dueDate })}
        >
          저장
        </Button>
      </div>
    </Card>
  );
}

function MessageCard({
  title,
  text,
  onCopy
}: {
  title: string;
  text: string;
  onCopy: () => Promise<void>;
}) {
  return (
    <Card muted className="ui-stat-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-text-strong">{title}</p>
        <Button size="sm" variant="secondary" className="ui-toolbar-button" onClick={onCopy}>
          복사
        </Button>
      </div>
      <pre className="mt-3 whitespace-pre-wrap text-sm text-text">{text}</pre>
    </Card>
  );
}
