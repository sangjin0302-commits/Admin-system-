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
  {
    key: "RECEIVED",
    title: "?묒닔",
    description: "臾몄쓽 湲곕낯 ?뺣낫? ?붿껌 寃곌낵瑜??섏쭛???④퀎",
  },
  {
    key: "ANALYZED",
    title: "遺꾩꽍",
    description: "AI/Lawbot 遺꾩꽍怨?異붽? ?뺤씤 ?ы빆???뺣━???④퀎",
  },
  {
    key: "QUOTING",
    title: "寃ъ쟻",
    description: "?쒕퉬??踰붿쐞, 鍮꾩슜, 議곌굔??議곗젙?섎뒗 ?④퀎",
  },
  {
    key: "CONTRACT",
    title: "怨꾩빟/?섏엫",
    description: "怨꾩빟 珥덉븞, ?뱀빟, ?섏엫 ?꾪솚???ㅻ（???④퀎",
  },
  {
    key: "CASEWORK",
    title: "?ш굔 吏꾪뻾",
    description: "?쒕쪟 ?섏쭛, ?쒖텧, 蹂댁셿 ??묒쓣 吏꾪뻾?섎뒗 ?④퀎",
  },
  {
    key: "CLOSED",
    title: "醫낃껐",
    description: "?ш굔 ?꾨즺 ?먮뒗 醫낃껐 ?뺣━瑜?留덉튇 ?④퀎",
  },
];

const workflowOrder = steps.map((step) => step.key);

const quoteStatusLabels: Record<string, string> = {
  DRAFT: "초안",
  READY_TO_SEND: "발송 준비",
  SENT: "발송 완료",
  ACCEPTED: "수락",
  REJECTED: "거절",
  EXPIRED: "만료",
};

const caseStageLabels: Record<string, string> = {
  CONTRACT_PREPARATION: "계약 준비",
  DOCUMENT_COLLECTION: "서류 수집",
  UNDER_REVIEW: "검토 중",
  SUBMITTED: "제출 완료",
  SUPPLEMENT_REQUESTED: "보완 요청",
  COMPLETED: "완료",
  ON_HOLD: "보류",
  CLOSED: "종결",
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
  caseStage,
}: WorkflowProgressPanelProps) {
  const currentStep = steps.find((step) => step.key === currentKey) ?? steps[0];

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="ui-kicker">吏꾪뻾 ?먮쫫</p>
          <h3 className="mt-2 ui-section-title">?꾩옱 吏꾪뻾 ?곹솴???쒕늿??蹂댁씠?꾨줉 ?뺣━?덉뒿?덈떎</h3>
          <p className="mt-2 text-sm text-text-muted">
            ?꾩옱 ?④퀎??<span className="font-semibold text-text-strong">{currentStep.title}</span>?대ŉ, ?ㅼ쓬 ?묒뾽?쇰줈 ?먯뿰?ㅻ읇寃??댁뼱吏????덈룄濡??먮쫫???쒖떆?⑸땲??
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-primary/20 bg-primary-soft text-primary">
            ?꾩옱 ?④퀎 / {currentStep.title}
          </Badge>
          <Badge className="border-line-strong bg-surface text-text-strong">
            Lawbot {lawbotStatus === "available" ? "연결됨" : lawbotStatus === "error" ? "오류" : "대기"}
          </Badge>
          {quoteStatus ? (
            <Badge className="border-line-strong bg-surface text-text-strong">
              寃ъ쟻 ?곹깭 / {quoteStatusLabels[quoteStatus] ?? quoteStatus}
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
                state === "upcoming" ? "border-line bg-surface-muted" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-text-strong">{step.title}</span>
                <span
                  className={[
                    "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold",
                    state === "done" ? "bg-emerald-600 text-white" : "",
                    state === "current" ? "bg-primary text-white" : "",
                    state === "upcoming" ? "bg-white text-text-muted border border-line" : "",
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

