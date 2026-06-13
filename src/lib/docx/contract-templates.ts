/**
 * 표준 계약서 템플릿.
 * placeholder ({{name}}) 는 변수 치환.
 */

export type ContractTemplate = {
  key: string;
  label: string;
  sections: readonly { heading: string; body: string }[];
};

export const CONTRACT_TEMPLATES: readonly ContractTemplate[] = [
  {
    key: "SERVICE",
    label: "용역 계약서",
    sections: [
      { heading: "제1조 (목적)", body: "본 계약은 {{providerName}}(이하 “수임인”)이 {{clientName}}(이하 “위임인”)으로부터 {{scope}} 업무를 위임받아 수행함에 있어 필요한 사항을 정함을 목적으로 한다." },
      { heading: "제2조 (업무 범위)", body: "수임인의 업무 범위는 다음과 같다.\n1. {{scope}}\n2. 위 업무에 부수하는 자료 정리·검토" },
      { heading: "제3조 (수임 기간)", body: "본 계약의 수임 기간은 {{startDate}}부터 {{endDate}}까지로 한다." },
      { heading: "제4조 (수임료)", body: "위임인은 수임인에게 다음과 같이 수임료를 지급한다.\n• 착수금: {{retainer}}원 (계약 체결 시)\n• 잔금: {{balance}}원 (업무 완료 시)" },
      { heading: "제5조 (비용 분담)", body: "관청 수수료, 인지대, 송달료, 출장비 등 실비는 위임인이 별도 부담한다." },
      { heading: "제6조 (결과 보장의 한계)", body: "수임인은 본 업무 처리에 있어 최선을 다하나, 관할 기관의 판단에 따른 결과를 보장하지 않는다." },
      { heading: "제7조 (비밀유지)", body: "수임인은 업무 수행 과정에서 알게 된 위임인의 정보를 외부에 누설하지 않으며, 수임 종료 후에도 동일하다." },
      { heading: "제8조 (계약 해지)", body: "양 당사자는 상대방의 중대한 의무 위반이 있을 경우 서면 통지로 본 계약을 해지할 수 있다." },
      { heading: "제9조 (분쟁 해결)", body: "본 계약과 관련된 분쟁은 협의로 해결하며, 협의가 이루어지지 않을 경우 수임인의 사무소 소재지 관할 법원을 전속 관할로 한다." }
    ]
  },
  {
    key: "LEASE_REVIEW",
    label: "임대차계약 검토 위임",
    sections: [
      { heading: "제1조 (목적)", body: "본 계약은 위임인이 체결하려는 임대차계약의 내용 검토 및 자문을 수임인에게 의뢰함을 목적으로 한다." },
      { heading: "제2조 (업무 범위)", body: "수임인의 업무는 다음과 같다.\n1. 임대차계약서 내용 검토 및 의견 제시\n2. 위임인이 요청하는 수정안 작성 자문" },
      { heading: "제3조 (수임료)", body: "위임인은 검토 완료 시 {{fee}}원을 지급한다." },
      { heading: "제4조 (책임 한계)", body: "수임인의 검토는 일반적인 행정·민사적 관점에 한하며, 임대차 관계 성립 후 발생할 수 있는 모든 법적·경제적 위험을 보장하지 않는다." },
      { heading: "제5조 (비밀유지)", body: "수임인은 검토 자료를 외부에 누설하지 않는다." }
    ]
  },
  {
    key: "FACT_INVESTIGATION",
    label: "사실조사 보고서 작성 위임",
    sections: [
      { heading: "제1조 (목적)", body: "본 계약은 위임인이 사실조사 보고서 작성을 수임인에게 의뢰함을 목적으로 한다." },
      { heading: "제2조 (조사 범위)", body: "조사 범위는 다음과 같다.\n{{scope}}" },
      { heading: "제3조 (조사 방법)", body: "수임인은 위임인이 제공한 자료와 합법적으로 수집 가능한 자료를 바탕으로 조사한다. 강제력 있는 조사는 포함하지 않는다." },
      { heading: "제4조 (수임료)", body: "수임료는 {{fee}}원으로 하며, 보고서 납부 시 지급한다." },
      { heading: "제5조 (보고서 사용 범위)", body: "본 보고서는 위임인의 행정·민사 절차에 사용 가능하며, 제3자에게 무단으로 배포할 수 없다." }
    ]
  }
];

export function getContractTemplate(key: string): ContractTemplate | undefined {
  return CONTRACT_TEMPLATES.find((t) => t.key === key);
}
