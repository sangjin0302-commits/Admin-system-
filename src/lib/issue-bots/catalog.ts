export const issueBotCatalog = [
  {
    key: "visa-screening-bot",
    label: "비자 쟁점 봇",
    description: "비자 요건, 사전 리스크, 추가 확인 포인트를 정리하는 봇"
  },
  {
    key: "stay-status-bot",
    label: "출입국·체류 쟁점 봇",
    description: "체류 상태, 마감일, 보완 가능성, 제출 경로를 정리하는 봇"
  },
  {
    key: "appeal-strategy-bot",
    label: "행정심판 쟁점 봇",
    description: "불이익 처분, 쟁점 구조, 주장 포인트를 정리하는 봇"
  },
  {
    key: "licensing-review-bot",
    label: "인허가 쟁점 봇",
    description: "인허가 요건, 제출 서류, 기관별 확인 포인트를 정리하는 봇"
  }
] as const;

export type IssueBotCatalogItem = (typeof issueBotCatalog)[number];

export function getIssueBotLabel(botKey: string) {
  return issueBotCatalog.find((item) => item.key === botKey)?.label ?? botKey;
}
