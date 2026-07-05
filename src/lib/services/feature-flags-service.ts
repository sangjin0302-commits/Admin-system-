/**
 * 기능 플래그 (Feature Flags) — 사이트 관리자가 관리자 패널에서 기능을 켜고 끕니다.
 *
 * 저장: SiteSetting key = "feature.flags", value = JSON.stringify({ [featureKey]: boolean })
 * 캐시: 30초 인메모리 (편집 시 무효화)
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const SITE_SETTING_KEY = "feature.flags";
const CACHE_MS = 30_000;

export type FeatureCategory = "marketing" | "operations" | "ux";

export type FeatureDefinition = {
  key: string;
  label: string;
  category: FeatureCategory;
  default: boolean;
  description?: string;
  public?: boolean; // 공개 API로 노출 가능 여부
};

export const FEATURE_REGISTRY: readonly FeatureDefinition[] = [
  { key: "newsletter", label: "뉴스레터", category: "marketing", default: true, description: "이메일 뉴스레터 발송 및 구독" },
  { key: "booking", label: "온라인 예약", category: "marketing", default: true, description: "온라인 상담 예약 기능" },
  { key: "case_stories", label: "AI 사례 스토리", category: "marketing", default: true, description: "AI 자동 생성 사례 스토리" },
  { key: "landing_builder", label: "랜딩 페이지 빌더", category: "marketing", default: true, description: "관리자용 랜딩 페이지 편집" },
  { key: "naver_reviews", label: "네이버 리뷰 벨트", category: "marketing", default: true, description: "네이버 리뷰 노출 벨트" },
  { key: "trust_belt", label: "신뢰 뱃지 벨트", category: "marketing", default: true, description: "신뢰 뱃지 노출" },
  { key: "utm_dashboard", label: "UTM 대시보드", category: "marketing", default: true, description: "UTM 유입 분석 대시보드" },
  { key: "brand_intro", label: "브랜드 인트로 모션", category: "marketing", default: false, description: "홈 브랜드 인트로 애니메이션", public: true },
  { key: "ai_chatbot", label: "AI 챗봇", category: "marketing", default: true, description: "공개 페이지 AI 챗봇", public: true },
  { key: "workflow_engine", label: "워크플로 자동화", category: "operations", default: true, description: "자동화 워크플로 엔진" },
  { key: "ai_drafting", label: "AI 서면 초안", category: "operations", default: true, description: "AI 자동 초안 생성" },
  { key: "voice_memo", label: "음성 메모", category: "operations", default: true, description: "음성 메모 및 STT" },
  { key: "calendar_sync", label: "캘린더 동기", category: "operations", default: true, description: "Google 캘린더 양방향 동기" },
  { key: "finance_report", label: "재무 리포트", category: "operations", default: true, description: "재무 리포트 자동 생성" },
  { key: "bottom_sheet_consult", label: "모바일 바텀시트 상담", category: "ux", default: true, description: "모바일 하단 바텀시트 상담", public: true },
  { key: "sticky_cta", label: "Sticky CTA", category: "ux", default: true, description: "고정 CTA 버튼", public: true },
  { key: "portal_realtime", label: "포털 실시간 알림", category: "ux", default: true, description: "고객 포털 실시간 알림 (SSE)" },
  { key: "review_automation", label: "후기 요청 자동화", category: "marketing", default: true, description: "종결 사건 후기 요청 자동 발송" },
  { key: "priority_scoring", label: "AI 우선순위 스코어", category: "operations", default: true, description: "AI가 문의 우선순위 자동 점수화" },
  { key: "pr_syndication", label: "PR 다채널 배포", category: "marketing", default: false, description: "블로그 발행 시 채널별 문안(네이버·페이스북·링크드인·텔레그램) 자동 생성" },
  { key: "hometax_integration", label: "홈택스 연동", category: "operations", default: false, description: "국세청 홈택스 세금계산서 자동 발행" },
  { key: "gov24_integration", label: "정부24 서류 연동", category: "operations", default: false, description: "정부24 서류 자동 발급 요청" },
  { key: "bank_matching", label: "은행 미수금 매칭", category: "operations", default: false, description: "은행 CSV 거래내역 자동 매칭" },
  { key: "kakao_workspace_bot", label: "카카오 워크스페이스 봇", category: "operations", default: false, description: "카카오 채널에서 관리자 명령 실행" },
  { key: "modusign_esign", label: "모두싸인 전자계약", category: "operations", default: false, description: "모두싸인 서명 요청/상태 추적" },
  { key: "precedent_database", label: "행정심판 판례 DB", category: "operations", default: true, description: "행정심판 판례 검색·매칭 및 Lawbot 동기화" },
  { key: "admin_network", label: "행정사 협업 네트워크", category: "operations", default: false, description: "동료 행정사 사건 공유·재배정 네트워크" },
  { key: "onsite_meeting", label: "온사이트 미팅 관리", category: "operations", default: false, description: "방문 상담 일정·지도·동선 최적화" },
  { key: "realtime_interpreter", label: "다국어 실시간 통역", category: "operations", default: false, description: "상담용 KO/EN/ZH/VI 실시간 통역" },
  { key: "tax_partner_referral", label: "세무사 연계", category: "operations", default: true, description: "파트너 세무사 매칭 및 소개 수수료 관리" },
  { key: "profile_enrichment", label: "고객 프로필 자동 강화", category: "operations", default: true, description: "이메일 도메인·공개정보로 고객 프로필 자동 강화" },
  { key: "customer_journey", label: "의뢰인 여정 시각화", category: "operations", default: true, description: "문의→계약→종결 단계별 소요시간·병목 분석" },
  { key: "sentiment_analysis", label: "AI 감정 분석", category: "operations", default: true, description: "고객 메시지 감정·위험 신호 자동 감지" },
  { key: "needs_prediction", label: "니즈 예측", category: "operations", default: true, description: "진행 중 사건의 다음 니즈 자동 예측" },
  { key: "vip_concierge_bot", label: "VIP 컨시어지 봇", category: "operations", default: true, description: "VIP 고객 전용 24/7 AI 컨시어지" },
  { key: "ai_agent_workflows", label: "AI 멀티스텝 자동화", category: "operations", default: true, description: "예약 워크플로를 한 번에 실행 (스코어→체크리스트→스크립트 등)" },
  { key: "voice_command", label: "음성 명령", category: "operations", default: true, description: "관리자 음성 명령으로 페이지 이동/필터" },
  { key: "messenger_intake_bot", label: "메신저 자동 접수 봇", category: "operations", default: false, description: "텔레그램/카톡 메시지에서 문의 자동 추출 (웹훅 설정 필요)" },
  { key: "audio_briefing", label: "아침 오디오 브리핑", category: "operations", default: true, description: "매일 아침 오디오 브리핑 자동 생성" },
  { key: "ai_auto_reply", label: "AI 대리 회신 자동 승인", category: "operations", default: false, description: "신규 문의에 AI 초안을 생성하고 확신도 임계 이상이면 자동 발송" },
  { key: "team_notifications", label: "Slack/Discord 알림", category: "operations", default: false, description: "Slack/Discord 웹훅으로 팀 이벤트 이중 알림" },
  { key: "case_copilot", label: "AI 사건 코파일럿", category: "operations", default: true, description: "사건 상세 페이지 실시간 AI 조언 사이드 드로어" },
  { key: "document_dictation", label: "음성 서면 받아쓰기", category: "operations", default: true, description: "구술 내용을 정형화된 법률 서면으로 자동 변환" },
  { key: "case_brainstorm", label: "AI 브레인스토밍 세션", category: "operations", default: true, description: "난이도 높은 사건 전략을 대화형으로 탐색" },
  { key: "franchise_saas", label: "프랜차이즈 SaaS", category: "operations", default: false, description: "다른 행정사무소에 ETHOS 시스템 SaaS로 판매" },
  { key: "api_marketplace", label: "API 마켓플레이스", category: "operations", default: false, description: "Lawbot/AI 초안을 유료 API로 외부 판매" },
  { key: "dataset_marketplace", label: "AI 학습 데이터셋 판매", category: "operations", default: false, description: "익명화 사건 데이터를 ML 학습용 데이터셋으로 판매" },
  { key: "certification_courses", label: "행정사 자격증 강의", category: "marketing", default: false, description: "커리큘럼·퀴즈·수료증 확장 강의 시스템" },
  { key: "international_regions", label: "국제 진출 (JP/VN)", category: "marketing", default: false, description: "일본·베트남 다국어 지역 사이트" },
  { key: "naver_kin_auto_answer", label: "네이버 지식iN 자동 답변", category: "marketing", default: false, description: "네이버 지식iN 관련 질문 자동 감지·답변 초안 생성" },
  { key: "youtube_content_gen", label: "유튜브 컨텐츠 자동 생성", category: "marketing", default: false, description: "블로그 글을 유튜브용 스크립트·TTS·슬라이드로 변환" },
  { key: "podcast_series", label: "팟캐스트 시리즈", category: "marketing", default: false, description: "주간 팟캐스트 에피소드 자동 생성 및 RSS 피드 배포" },
  { key: "instagram_cards", label: "인스타그램 카드뉴스", category: "marketing", default: false, description: "판례·블로그·뉴스에서 카드뉴스 슬라이드 자동 생성" },
  { key: "short_video_gen", label: "쇼츠/틱톡 자동 생성", category: "marketing", default: false, description: "30초 세로형 쇼츠 스크립트·TTS·슬라이드 자동 생성" },
  { key: "vector_search", label: "벡터 검색 판례 DB", category: "operations", default: true, description: "판례 의미 기반 검색 (임베딩)" },
  { key: "knowledge_graph", label: "사무소 지식 그래프", category: "operations", default: true, description: "사건·의뢰인·판례·법령 연결 시각화" },
  { key: "legal_news_ai", label: "법률 뉴스 자동 요약·매칭", category: "operations", default: true, description: "매일 법률 뉴스 요약 후 활성 사건 자동 매칭" },
  { key: "citation_verifier", label: "서면 인용 자동 검증", category: "operations", default: true, description: "AI 서면 초안의 법조문·판례번호 인용 검증" },
  { key: "rag_chatbot", label: "RAG 지식 챗봇", category: "marketing", default: true, description: "사무소 전체 지식 기반 RAG 챗봇", public: true },
  { key: "full_auto_case_flow", label: "완전 자동 사건 진행", category: "operations", default: false, description: "신규 문의 → AI 스크리닝 → 견적 → 계약 → 서명 → 사건 개설을 확신도 임계 이상이면 자동 진행" },
  { key: "ai_decision_tree", label: "AI 의사결정 트리", category: "operations", default: true, description: "사건 단계별로 다음 액션을 AI가 추천 (문서요청/미팅/서면초안/종결/에스컬레이션)" },
  { key: "deadline_autopilot", label: "자동 마감 캘린더 봇", category: "operations", default: true, description: "활성 사건 마감 D-7/D-3/당일 자동 리마인더 + 후속 미완료 시 에스컬레이션" },
  { key: "audit_anomaly_ai", label: "AI 감사 로그 이상행동 탐지", category: "operations", default: true, description: "관리자 감사 로그 기준선 대비 이상행동(비정상 시각 접근/대량 내보내기/실패 로그인 급증) 감지" },
  { key: "tax_report_autopilot", label: "자동 세금 신고 봇", category: "operations", default: false, description: "월말 부가세·종합소득세 신고 초안 자동 생성 후 홈택스 큐 또는 수동 대기열로 제출" },
  { key: "holographic_logo", label: "홀로그래픽 3D 로고", category: "ux", default: false, description: "WebGL 기반 3D 회전 ETHOS 로고 (히어로 섹션)", public: true },
  { key: "homepage_personalization", label: "홈페이지 맞춤화", category: "ux", default: false, description: "방문자 컨텍스트(지역·UTM·리퍼러)에 따라 히어로 카피 자동 변형", public: true },
  { key: "voice_ai_consult", label: "AI 음성 상담", category: "ux", default: false, description: "실시간 음성 대화형 AI 상담", public: true },
  { key: "ar_card", label: "AR 명함", category: "ux", default: false, description: "WebXR 기반 3D 명함 페이지 (QR 스캔 진입)", public: true },
  { key: "haptic_feedback", label: "햅틱 피드백", category: "ux", default: true, description: "모바일 진동 피드백 (CTA·폼 성공 등)", public: true },
  { key: "notion_sync", label: "Notion 사건 동기화", category: "operations", default: false, description: "사건·문의 Notion 페이지 양방향 동기화" },
  { key: "backup_mirror", label: "Airtable/Sheets 미러 백업", category: "operations", default: false, description: "Airtable 또는 Google Sheets 실시간 미러 백업" },
  { key: "zapier_webhooks", label: "Zapier/Make 웹훅", category: "operations", default: false, description: "이벤트 발생 시 등록된 웹훅에 POST 배포" },
  { key: "google_workspace_admin", label: "Google Workspace 계정 관리", category: "operations", default: false, description: "Google Workspace 사용자 생성·중지 자동화" },
  { key: "crm_integration", label: "HubSpot/Salesforce CRM", category: "operations", default: false, description: "CRM(HubSpot·Salesforce) 문의·사건 동기화" },
  { key: "finetune_dataset", label: "파인튜닝 데이터셋 축적", category: "operations", default: true, description: "승인된 AI 응답을 파인튜닝용 데이터셋으로 자동 축적 (JSONL/Anthropic 포맷 내보내기)" },
  { key: "ab_auto_promote", label: "A/B 승자 자동 반영", category: "operations", default: false, description: "카이제곱 유의검정 통과 시 승자 변형을 기본값으로 자동 승격 (주간 크론)" },
  { key: "ai_metrics_tracking", label: "AI 모델 성능 대시보드", category: "operations", default: true, description: "AI 호출별 토큰/지연/비용/성공률 집계 및 대시보드" },
  { key: "prompt_optimizer", label: "자동 프롬프트 최적화", category: "operations", default: false, description: "프롬프트 버전 A/B 및 사용자 피드백 기반 자동 승격" },
  { key: "smart_model_routing", label: "AI 모델 자동 선택", category: "operations", default: true, description: "태스크 종류·복잡도에 따라 Haiku/Sonnet/Opus 자동 선택 (비용 최적화)" },
  { key: "distributed_tracing", label: "분산 트레이싱", category: "operations", default: false, description: "OpenTelemetry 호환 스팬 수집·워터폴 뷰 (성능 오버헤드)" },
  { key: "ai_regression_test", label: "AI 응답 품질 회귀 테스트", category: "operations", default: true, description: "일일 AI 응답 회귀 테스트 자동 실행·품질 저하 감지" },
  { key: "canary_rollout", label: "카나리 배포", category: "operations", default: false, description: "기능 플래그를 사용자 비율 기반으로 단계적 노출 (해시 기반)" },
  { key: "auto_rollback", label: "자동 롤백", category: "operations", default: false, description: "오류율 급증 감지 시 최근 활성화된 플래그·카나리 자동 롤백" },
  { key: "chaos_engineering", label: "혼돈 공학 실험", category: "operations", default: false, description: "지연·오류 자동 주입 실험 (dev/staging 전용)" },
  { key: "cloudflare_images", label: "Cloudflare Images 리사이즈", category: "operations", default: false, description: "Cloudflare Images로 이미지 업로드·자동 리사이즈" },
  { key: "read_replica_routing", label: "DB 읽기 복제본 라우팅", category: "operations", default: false, description: "읽기 쿼리를 복제본으로 라우팅하여 주 DB 부하 감소" },
  { key: "job_queue", label: "잡 큐 시스템", category: "operations", default: true, description: "자체 구현 잡 큐 — 비동기 작업 예약·재시도" },
  { key: "multi_admin_sync", label: "다중 관리자 실시간 동기", category: "operations", default: true, description: "관리자 동시 편집 감지·존재 표시 (SSE)" },
  { key: "edge_cache_optimization", label: "글로벌 CDN 캐싱", category: "operations", default: true, description: "Vercel Edge Cache-Control 헤더·경로 재검증" },
  { key: "self_documentation", label: "자기 문서화 시스템", category: "operations", default: true, description: "코드 상태에서 시스템 문서(기능/설정/환경) 자동 생성", public: true },
  { key: "self_healing", label: "자가 치유 시스템", category: "operations", default: true, description: "에러 감지 → 알려진 안전 복구 자동 실행 · 미지 에러는 AI 분석 후 승인 대기" },
  { key: "adaptive_ui", label: "자가 학습 UI", category: "ux", default: true, description: "관리자 사용 패턴 추적 · 자주 쓰는 페이지 바로가기 및 재배치 제안" },
  { key: "ai_standby_operator", label: "24/7 AI 대행 (승인 워크플로)", category: "operations", default: false, description: "업무 외 시간 AI가 문의 대응 · 관리자 아침 승인 큐" },
  { key: "auto_marketing_campaign", label: "자율 마케팅 캠페인", category: "marketing", default: false, description: "광고 성과 기반 예산·카피 자동 조정 추천 (실제 적용은 승인 필요)" },
] as const;

const PUBLIC_KEYS = new Set(FEATURE_REGISTRY.filter((f) => f.public).map((f) => f.key));
const REGISTRY_MAP = new Map<string, FeatureDefinition>(FEATURE_REGISTRY.map((f) => [f.key, f]));

let _cache: { at: number; data: Record<string, boolean> } | null = null;

export function invalidateFeatureFlagsCache() {
  _cache = null;
}

function defaultsMap(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const f of FEATURE_REGISTRY) map[f.key] = f.default;
  return map;
}

async function readRawFlags(): Promise<Record<string, boolean>> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SITE_SETTING_KEY } });
    if (!row?.value) return {};
    const parsed = JSON.parse(row.value);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "boolean") out[k] = v;
    }
    return out;
  } catch (err) {
    logger.warn("[feature-flags] 저장된 플래그를 읽지 못했습니다", err);
    return {};
  }
}

/** 전체 플래그 조회 (DB + 레지스트리 기본값 병합, 30초 캐시). */
export async function getAllFlags(): Promise<Record<string, boolean>> {
  if (_cache && Date.now() - _cache.at < CACHE_MS) return _cache.data;
  const stored = await readRawFlags();
  const merged = { ...defaultsMap(), ...stored };
  _cache = { at: Date.now(), data: merged };
  return merged;
}

/** 단일 플래그 조회. */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const all = await getAllFlags();
  if (key in all) return all[key];
  return REGISTRY_MAP.get(key)?.default ?? false;
}

/** 플래그 저장 (upsert). */
export async function setFeatureEnabled(key: string, enabled: boolean): Promise<void> {
  if (!REGISTRY_MAP.has(key)) {
    throw new Error(`알 수 없는 기능 키: ${key}`);
  }
  const stored = await readRawFlags();
  stored[key] = enabled;
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEY },
    create: { key: SITE_SETTING_KEY, value: JSON.stringify(stored) },
    update: { value: JSON.stringify(stored) },
  });
  invalidateFeatureFlagsCache();
}

/** 레지스트리 노출 (관리자 UI 그루핑용). */
export function getFeatureRegistry(): readonly FeatureDefinition[] {
  return FEATURE_REGISTRY;
}

/** 공개 API 노출용 — 화이트리스트된 플래그만 반환. */
export async function getPublicFlags(): Promise<Record<string, boolean>> {
  const all = await getAllFlags();
  const out: Record<string, boolean> = {};
  for (const k of PUBLIC_KEYS) {
    out[k] = all[k];
  }
  return out;
}

export function isPublicFeatureKey(key: string): boolean {
  return PUBLIC_KEYS.has(key);
}
