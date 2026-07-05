/**
 * PR 자동 배포 타입 및 상수 — 서버/클라이언트 공용.
 * pr-syndication-service.ts 에서 재-export 되지만 클라이언트에서
 * prisma import 를 피하기 위해 타입만 분리.
 */

export type SyndicationChannel = "naver" | "facebook" | "linkedin" | "telegram";

export const CHANNEL_LABEL: Record<SyndicationChannel, string> = {
  naver: "네이버 블로그",
  facebook: "페이스북 페이지",
  linkedin: "링크드인",
  telegram: "Telegram 채널",
};

export const CHANNEL_ORDER: SyndicationChannel[] = [
  "naver",
  "facebook",
  "linkedin",
  "telegram",
];

export type SyndicationChannelOutput = {
  channel: SyndicationChannel;
  text: string;
  generatedAt: string;
  posted?: boolean;
  postedAt?: string;
};

export type SyndicationRecord = {
  postId: string;
  slug: string;
  title: string;
  channels: SyndicationChannelOutput[];
  updatedAt: string;
};
