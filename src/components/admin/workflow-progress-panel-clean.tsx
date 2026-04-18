"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type WorkflowStep = {
  key: string;
  title: string;
  description: string;
};

type WorkflowProgressPanelProps = {
  currentKey: string;
  lawbotStatus: "available" | "disabled" | "error";
  quoteStatus?: string | null;
  caseStage?: string | null;
};

const steps: WorkflowStep[] = [
  { key: "RECEIVED", title: "접수", description: "문의 기본 정보와 요청 결과를 수집하는 단계" },
  { key: "ANALYZED", title: "분석", description: "AI와 Lawbot 기준으로 핵심 쟁점을 정리하는 단계" },
  { key: "QUOTING", title: "견적", description: "서비스 범위, 비용, 조건을 조율하는 단계" },
  { key: "CONTRACT", title: "계약/수임", description: "계약 초안과 수임 전환을 마무리하는 단계" },
  { key: "CASEWORK", title: "사건 진행", description: "서류 수집, 제출, 보완 등 실무를 수행하는 단계" },
  { key: "CLOSED", title: "종결", description: "사건 완료 또는 종결 정리를 마치는 단계" }
];

const workflowOrder = steps.map((step) => step.key);

const quoteStatusLabels: Record<string, string> = {
  DRAFT: "초안",
  READY_TO_SEND: "발송 준비",
  SENT: "발송 완료",
  ACCEPTED: "수락",
  REJECTED: "거절",
  EXPIRED: "만료"
};

const caseStageLabels: Record<string, string> = {
  CONTRACT_PREPARATION: "계약 준비",
  DOCUMENT_COLLECTION: "서류 수집",
  UNDER_REVIEW: "검토 중",
  SUBMITTED: "제출 완료",
  SUPPLEMENT_REQUESTED: "보완 요청",
  COMPLETED: "완료",
  ON_HOLD: "보류",
  CLOSED: "종결"
};

function getStepState(stepKey: string, currentKey: string) {
  const currentIndex = workflowOrder.indexOf(currentKey);
  const stepIndex = workflowOrder.indexOf(stepKey);

  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "current";
  return "upcoming";
}

export function WorkflowProgressPanel({
  currentKey,
  lawbotStatus,
  quoteStatus,
  caseStage
}: WorkflowProgressPanelProps) {
  const currentStep = steps.find((step) => step.key === currentKey) ?? steps[0];

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="ui-kicker">진행 흐름</p>
          <h3 className="mt-2 ui-section-title">현재 사건이 어느 단계인지 한눈에 확인할 수 있습니다</h3>
          <p className="mt-2 text-sm text-text-muted">
            현재 단계는 <span className="font-semibold text-text-strong">{currentStep.title}</span>이고, 다음 작업으로 자연스럽게 이어지도록 흐름을 제시합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-primary/20 bg-primary-soft text-primary">현재 단계 / {currentStep.title}</Badge>
          <Badge className="border-line-strong bg-surface text-text-strong">
            Lawbot {lawbotStatus === "available" ? "연결됨" : lawbotStatus === "error" ? "오류" : "대기"}
          </Badge>
          {quoteStatus ? (
            <Badge className="border-line-strong bg-surface text-text-strong">
              견적 상태 / {quoteStatusLabels[quoteStatus] ?? quoteStatus}
            </Badge>
          ) : null}
          {caseStage ? (
            <Badge className="border-line-strong bg-surface text-text-strong">
              ?ш굔 ?④퀎 / {caseStageLabels[caseStage] ?? caseStage}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-6">
        {steps.map((step) => {
          const state = getStepState(step.key, currentKey);
          return (
            <div
              key={step.key}
              className={[
                "rounded-2xl border p-4 transition",
                state === "done" ? "border-emerald-200 bg-emerald-50/80" : "",
                state === "current" ? "border-primary/30 bg-primary-soft/60 shadow-sm" : "",
                state === "upcoming" ? "border-line bg-surface-muted" : ""
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-text-strong">{step.title}</span>
                <span
                  className={[
                    "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold",
                    state === "done" ? "bg-emerald-600 text-white" : "",
                    state === "current" ? "bg-primary text-white" : "",
                    state === "upcoming" ? "border border-line bg-white text-text-muted" : ""
                  ].join(" ")}
                >
                  {state === "done" ? "완료" : state === "current" ? "진행중" : "대기"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-text-muted">{step.description}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

