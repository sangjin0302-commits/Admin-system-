export type OperationsSettings = {
  consultationIntro: string;
  priorityConsultationGuide: string;
  paidDiagnosisGuide: string;
  docsReviewGuide: string;
  declineGuide: string;
  consultationLinkLabel: string;
  consultationLinkUrl: string;
  contractGuide: string;
  paymentGuide: string;
  paymentMethodLabel: string;
  paymentLinkUrl: string;
  bankTransferGuide: string;
  internalRoutingNote: string;
};

export const defaultOperationsSettings: OperationsSettings = {
  consultationIntro:
    "현재는 별도 예약 링크 없이 관리자 검토 후 순차적으로 상담 가능 시간과 진행 방식을 안내합니다.",
  priorityConsultationGuide:
    "긴급 건 또는 A급 문의는 먼저 회신 시간을 잡고, 필요한 기본 자료를 함께 요청합니다.",
  paidDiagnosisGuide:
    "유료 사전진단이 필요한 경우 상담 범위, 예상 검토 항목, 결제 방식부터 먼저 안내합니다.",
  docsReviewGuide:
    "서류 검토 우선 건은 상담보다 먼저 기본 서류 목록과 제출 방법을 안내합니다.",
  declineGuide:
    "즉시 수임이 어렵거나 범위 밖인 경우에는 제한된 안내만 제공하고, 필요 시 외부 연계를 검토합니다.",
  consultationLinkLabel: "상담 링크",
  consultationLinkUrl: "",
  contractGuide:
    "계약 링크가 없으면 계약 초안 내용을 먼저 공유하고, 확정 후 계약 체결 처리만 관리자에서 반영합니다.",
  paymentGuide:
    "결제 링크가 없으면 계좌이체 또는 수기 안내 후 입금 확인 시 사건 전환을 진행합니다.",
  paymentMethodLabel: "계좌이체 / 수기 결제",
  paymentLinkUrl: "",
  bankTransferGuide:
    "입금 계좌, 예금주, 입금자명 작성 방식, 입금 후 회신 요청 문구를 여기에 정리해 두고 복사해 사용합니다.",
  internalRoutingNote:
    "A/B/C/D 선별은 상담 우선순위와 무료 응대 범위를 줄이기 위한 기준이며, 최종 판단은 관리자 검토로 확정합니다."
};
