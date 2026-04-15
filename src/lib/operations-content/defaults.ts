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
    "현재는 별도 예약 링크 없이 관리자 검토 후 상담 가능 여부와 진행 방식을 순차적으로 안내드립니다.",
  priorityConsultationGuide:
    "긴급 건 또는 A급 문의는 우선 검토 후 빠르게 연락드리며, 필요한 기본 서류와 상담 준비사항을 먼저 안내합니다.",
  paidDiagnosisGuide:
    "사전진단이 필요한 경우에는 검토 범위, 확인이 필요한 핵심 쟁점, 예상 절차와 비용 범위를 먼저 설명드린 후 진행 여부를 안내합니다.",
  docsReviewGuide:
    "서류 검토가 먼저 필요한 문의는 상담에 앞서 기본 서류 목록과 제출 방법을 안내하고, 서류 확인 후 상담 또는 견적 단계로 연결합니다.",
  declineGuide:
    "현재 직접 수임이 어렵거나 추가 확인이 더 필요한 경우에는 바로 단정하지 않고, 가능한 범위의 일반 안내 또는 추가 검토 필요 여부를 먼저 전달합니다.",
  consultationLinkLabel: "상담 예약 안내",
  consultationLinkUrl: "",
  contractGuide:
    "아직 전자계약 링크가 없는 경우에는 계약 안내문과 진행 범위를 먼저 공유드리고, 확정 후 관리자 화면에서 계약 체결 상태를 반영합니다.",
  paymentGuide:
    "결제 링크가 없는 경우에는 계좌이체 또는 별도 안내 방식으로 결제를 진행하고, 입금 확인 후 사건 진행 상태로 전환합니다.",
  paymentMethodLabel: "계좌이체 / 별도 결제 안내",
  paymentLinkUrl: "",
  bankTransferGuide:
    "입금 계좌, 예금주, 입금자명 작성 방식, 입금 후 회신 요청 문구를 이 영역에 정리해 두고 복사하여 안내합니다.",
  internalRoutingNote:
    "A/B/C/D 선별 결과는 상담 우선순위와 운영 동선을 정하기 위한 기준입니다. 최종 판단은 관리자 검토 후 확정합니다."
};
