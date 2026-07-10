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

export type FeatureCategory = "marketing" | "operations" | "ux" | "portal" | "ai" | "platform";

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
  { key: "citation_verify_gate", label: "인용 검증 게이트", category: "operations", default: true, description: "AI 서면 발송 전 폐지 조문·미검증 판례 자동 차단 게이트" },
  { key: "deadline_holiday_aware", label: "기한 공휴일·특별법 반영", category: "operations", default: true, description: "한국 공휴일·주말·특별법(소음진동·국세·병역) 기한 자동 조정" },
  { key: "fact_check_gate", label: "AI 응답 fact-check 게이트", category: "operations", default: true, description: "AI 초안 발송 전 사실 주장 자동 대조 (판례·법령·의뢰인 데이터)" },
  { key: "precedent_live_verify", label: "판례 인용 실시간 재확인", category: "operations", default: true, description: "판례번호를 로컬 DB·Lawbot·law.go.kr 캐시로 실시간 재검증" },
  { key: "document_similarity", label: "문서 유사도·표절 감지", category: "operations", default: true, description: "신규 초안과 사무소 기존 문서 유사도 감지 (n-gram)" },
  { key: "e2e_runner_ui", label: "E2E 러너 UI", category: "operations", default: false, description: "관리자 Playwright E2E 실행/결과 대시보드 (dev 전용)" },
  { key: "arch_diagram", label: "자동 아키텍처 다이어그램", category: "operations", default: true, description: "src 스캔 기반 서비스 의존성 그래프를 Mermaid 다이어그램으로 자동 생성" },
  { key: "sentry_monitoring", label: "Sentry 에러 모니터링", category: "operations", default: false, description: "SENTRY_DSN 설정 시 미치유 에러를 Sentry로 배치 전송 · 치유 시 이벤트 해결 마킹" },
  { key: "outcome_predictor", label: "사건 승소·패소 예측", category: "operations", default: true, description: "사건 조건·판례·증거 기반 승소 확률 및 리스크 요인 분석" },
  { key: "acceptance_advisor", label: "수임 여부 AI 조언", category: "operations", default: true, description: "신규 문의의 수임/거절/조건부 판단 및 근거 제시" },
  { key: "text_ab_compare", label: "답변 문안 A/B 비교", category: "operations", default: true, description: "두 문안의 명료성·톤·설득력·법률 정확도 비교 및 합성 초안" },
  { key: "live_emotion_analyzer", label: "실시간 감정 분석", category: "operations", default: true, description: "고객 메시지 스트림 실시간 감정 감지·응대 톤 제안·에스컬레이션 경보" },
  { key: "evidence_trust_score", label: "원본 자료 신뢰도 스코어", category: "operations", default: true, description: "업로드 서류의 완결성·가독성·일관성·진위·최신성 자동 평가" },
  { key: "one_click_close", label: "원클릭 사건 클로징", category: "operations", default: true, description: "사건 종결 다단계 액션(상태·리포트·인보이스·NPS·캘린더·아카이브·리인게이지)을 원클릭 실행" },
  { key: "command_palette", label: "명령 팔레트 (Cmd/Ctrl+K)", category: "ux", default: true, description: "관리자 전역 명령 팔레트 — 페이지·사건·문의·플래그·액션 통합 검색" },
  { key: "client_context_sidebar", label: "의뢰인 컨텍스트 사이드바", category: "operations", default: true, description: "문의/사건 상세에서 이 의뢰인의 과거 이력·메시지·서류·결제·메모 자동 로딩" },
  { key: "macro_system", label: "매크로 시스템", category: "operations", default: true, description: "자주 쓰는 액션 시퀀스를 매크로로 저장·재생 (카톡/이메일/상태변경/과제/메모)" },
  { key: "tab_preload", label: "탭 프리로드 (호버 프리페치)", category: "ux", default: true, description: "사건/문의 목록 호버 시 상세 데이터 SWR 프리로드 — 탭 스위칭 지연 감소" },
  { key: "funnel_analytics", label: "전환 퍼널 분석", category: "operations", default: true, description: "문의 → 견적 → 계약 → 종결 단계별 전환율/드롭오프 대시보드 (/admin/funnel)" },
  { key: "channel_roi", label: "채널별 ROI 대시보드", category: "marketing", default: false, description: "채널별 광고비 수동 입력 → 계약률/CPA/ROAS 자동 산출 (/admin/channel-roi)" },
  { key: "newsletter_open_tracking", label: "뉴스레터 오픈 트래킹", category: "marketing", default: false, description: "이메일 1x1 픽셀로 오픈률 집계. Resend HTML 삽입 필요, 개인정보 고지 권장" },
  { key: "kakao_alimtalk_critical", label: "카카오 알림톡 (중요 마감)", category: "operations", default: false, description: "D-3/D-1 중요 마감만 카톡 알림톡 이중 발송 (Solapi/Aligo 크리덴셜 필요)" },
  { key: "draft_template_library", label: "서면 초안 템플릿 라이브러리", category: "operations", default: true, description: "카테고리별 서면 초안 preset 자동 제안 (document-templates/)" },
  { key: "unified_inbox", label: "통합 수신함", category: "operations", default: true, description: "카톡·이메일·텔레그램·네이버 문의 단일 리스트 (/admin/inbox)" },
  { key: "morning_sms_briefing", label: "아침 SMS/카톡 브리핑", category: "operations", default: false, description: "매일 아침 오늘 마감 + 어제 신규 + 24h 미응답 텍스트 push (SMS/알림톡 크리덴셜 필요)" },
  { key: "oneclick_draft_pipeline", label: "원클릭 서면 파이프라인", category: "operations", default: false, description: "음성→AI 초안→인용검증→PDF→이메일 단일 워크플로 (예약 파이프라인)" },
  { key: "landing_gap_finder", label: "랜딩 갭 파인더", category: "marketing", default: true, description: "GSC 상위 유입 키워드가 /keyword 랜딩과 매칭 안 되면 알림 (/admin/landing-gaps)" },
  { key: "testimonial_auto_placement", label: "후기 자동 배치", category: "marketing", default: false, description: "카테고리 매칭 기반 새 후기 → 관련 랜딩/블로그 자동 삽입 제안" },
  { key: "tax_export_csv", label: "세무 CSV 내보내기", category: "operations", default: true, description: "월별 WON 계약 매출 CSV 다운로드 (/admin/tax-export)" },
  { key: "ad_compliance_scan", label: "광고 규제 자가 점검", category: "operations", default: false, description: "AI가 홈페이지·블로그 문안에서 행정사법 §3 과대광고 리스크 감지" },
  { key: "public_track_v2", label: "공개 진행률 v2", category: "ux", default: false, description: "인증 없는 /track 링크 UX 강화 — 예상 다음 단계 + 예상 완료일" },
  { key: "doc_reminder_auto", label: "자료 미제출 자동 리마인더", category: "operations", default: false, description: "사건 개설 후 3일간 자료 없으면 자동 알림 (톡톡·이메일)" },
  { key: "inbox_bulk_actions", label: "수신함 일괄 액션", category: "operations", default: false, description: "다중 선택 → 일괄 미응답 해제/긴급 지정/초안 생성 (/admin/inbox)" },
  { key: "flag_usage_audit", label: "Flag 사용 감사", category: "operations", default: true, description: "138개 flag 카테고리별 현황 + default vs stored 대조 (/admin/flag-audit)" },
  { key: "auto_first_response_timestamp", label: "첫응답 시간 자동 기록", category: "operations", default: true, description: "상태 변경 시 firstResponseAt 자동 set (이미 mutation helper에 구현)" },
  { key: "channel_enum_normalize", label: "채널 enum 정규화", category: "operations", default: false, description: "intakeChannel 자유 문자열 → enum (migration 필요)" },
  { key: "landing_ai_draft", label: "랜딩 AI 초안 자동 생성", category: "marketing", default: false, description: "landing-gaps에서 원클릭 /keyword/[term] MDX 초안 (Anthropic 크레딧 필요)" },
  { key: "newsletter_subject_ab", label: "뉴스레터 제목 A/B", category: "marketing", default: false, description: "AI가 3개 후보 → 지난 오픈률 예측 → 승자 선택 (오픈트래킹 선행 필요)" },
  { key: "public_track_upload", label: "공개 트랙 자료 재업로드", category: "ux", default: false, description: "/track 페이지에서 인증없이 추가 자료 업로드 (Blob 직접)" },
  { key: "morning_briefing_view", label: "아침 3분 브리핑", category: "operations", default: true, description: "오늘 마감·미응답·신규 통합 랜딩 (/admin/morning)" },
  { key: "admin_home_briefing_default", label: "관리자 홈=브리핑", category: "ux", default: false, description: "관리자 로그인 후 첫 화면을 /admin/briefing로 리다이렉트" },
  { key: "inbox_kakao_deeplink", label: "카톡 원터치 답장", category: "ux", default: true, description: "인바운드 채널이 카톡이면 카톡 오픈 딥링크 노출" },
  { key: "next_action_chips", label: "다음 액션 chip", category: "operations", default: true, description: "문의 상세에 문서요청/미팅/견적/종결 원클릭 chip (ai_decision_tree 연계)" },
  { key: "flag_dormancy_cron", label: "Flag dormancy 알림", category: "operations", default: false, description: "주 1회 3개월 dormant flag 텔레그램 알림" },
  { key: "e2e_smoke_ci", label: "E2E smoke CI", category: "operations", default: false, description: "PR 시 신규 페이지 200 status 자동 검증 (Playwright)" },
  { key: "flag_cleanup_mode", label: "Flag 정리 모드", category: "operations", default: false, description: "138→100 축소 캠페인 (dormant + dup 정리)" },
  { key: "admin_nav_grouped", label: "Admin nav 그룹화", category: "ux", default: false, description: "150 admin 페이지 → 6 그룹 (오늘/의뢰/마케팅/운영/재무/설정)" },
  { key: "morning_channel_kpi", label: "아침 채널 KPI", category: "operations", default: true, description: "/admin/morning에 지난 7일 채널별 신규 문의 카드" },
  { key: "inquiry_kakao_reply_btn", label: "카톡 답장 딥링크", category: "ux", default: true, description: "문의 상세에 카톡 채널 오픈 버튼 (kakao_url:// 스킴)" },
  { key: "reply_3draft_picker", label: "회신 3안 후보", category: "operations", default: false, description: "AI가 3개 tone 후보 → 선택 → 발송 (text_ab_compare 연계)" },
  { key: "deadline_pre_warm_draft", label: "D-1 초안 예열", category: "operations", default: false, description: "마감 D-1 사건은 미리 AI가 초안 준비 대기" },
  { key: "consult_free_slots", label: "상담 무료 slot 표시", category: "marketing", default: false, description: "/consult에서 향후 7일 available slot 시각화 (calendar_sync 연계)" },
  { key: "post_consult_summary_email", label: "상담 후 요약 이메일", category: "operations", default: false, description: "상담 종료 시 AI 요약 + 다음 단계 자동 발송" },
  { key: "schema_dual_diff_ci", label: "이중 스키마 diff CI", category: "operations", default: true, description: "schema.sqlite ↔ schema.postgresql 필드 diff 자동 검증" },
  { key: "ad_spend_csv_import", label: "광고비 CSV 자동 import", category: "marketing", default: false, description: "네이버·구글 광고비 CSV 업로드 → channel.roi.spend 자동 update (/admin/channel-roi/import)" },
  { key: "profile_i18n_cache", label: "프로필 다국어 캐시", category: "marketing", default: false, description: "아랍어/영어 페이지 프로필 자동 번역 캐시" },
  { key: "testimonial_linkedin_auto", label: "후기 LinkedIn 자동 포스팅", category: "marketing", default: false, description: "승낙된 후기만 LinkedIn API 자동 게시" },
  { key: "kakao_channel_stats", label: "카톡 채널 통계 위젯", category: "marketing", default: false, description: "채널 팔로워/최근 대화 수 /admin/morning 표시 (API key 필요)" },
  { key: "naver_ads_api_sync", label: "네이버 검색광고 API 동기", category: "marketing", default: false, description: "Naver Search Ads API 자동 pull → channel.roi.spend 일일 update" },
  { key: "referral_tracking", label: "레퍼럴 링크 트래킹", category: "marketing", default: true, description: "?ref=xxx 개별 링크별 유입/계약 분석 (/admin/ref-tracking) — intakeRef 활용" },
  { key: "contract_preview_pdf", label: "계약서 PDF 미리보기", category: "operations", default: false, description: "문의 상세에서 템플릿+데이터 병합 PDF 미리보기" },
  { key: "document_version_diff", label: "서면 버전 diff", category: "operations", default: false, description: "동일 사건 서면 v1→v2 diff view" },
  { key: "newsletter_subject_preview", label: "뉴스레터 제목 A/B 프리뷰", category: "marketing", default: false, description: "발송 전 3개 subject 미리보기 (GA4 클릭률 A/B)" },
  { key: "blog_to_instagram_flow", label: "블로그→카드뉴스 파이프라인", category: "marketing", default: false, description: "instagram_cards 파이프라인 verify 후 자동 실행" },
  { key: "case_auto_precedent", label: "AI 판례 자동 인용", category: "operations", default: true, description: "vector_search + precedent_live_verify 활용 사건 등록시 관련 판례 3건 추천 UI" },
  { key: "vip_auto_tagging", label: "VIP 자동 태깅", category: "operations", default: true, description: "재의뢰 2회+ or 계약가 500만+ 자동 VIP 배지 (/admin/vips)" },
  { key: "blog_related_auto", label: "블로그 관련 글 자동", category: "marketing", default: true, description: "카테고리+태그 매칭 top 3 자동 삽입" },
  { key: "faq_schema_auto", label: "FAQ 스키마 자동 생성", category: "marketing", default: true, description: "블로그 본문 Q&A 패턴 감지 → FAQ JSON-LD 자동 삽입" },
  { key: "db_backup_blob_weekly", label: "DB 주간 dump → Blob", category: "operations", default: false, description: "backup-mirror cron 실 Blob 업로드 활성화 (용량 검토)" },
  { key: "env_masked_dump", label: "환경변수 마스킹 감사", category: "operations", default: false, description: ".env snapshot admin download (마스킹)" },
  { key: "new_dashboards_sidebar", label: "신규 대시보드 sidebar nav", category: "ux", default: false, description: "이번 세션 신규 9개 dashboard sidebar + command palette 등록" },
  { key: "dashboard_loading_skeletons", label: "대시보드 loading skeleton", category: "ux", default: true, description: "신규 페이지 loading.tsx 스켈레톤 추가 (ethos-skeleton class)" },
  { key: "dark_mode", label: "다크모드", category: "ux", default: false, description: "prefers-color-scheme 감지 + 수동 토글 (야간 작업 대응)" },
  { key: "semantic_color_tokens", label: "semantic color tokens", category: "ux", default: false, description: "text-red-600 등 raw color → text-danger/success/warning 추상화" },
  { key: "quote_calculator", label: "견적 계산기", category: "operations", default: true, description: "사건유형·옵션 조합 → 기본금+추가금 즉시 계산 (/admin/quote-calc)" },
  { key: "inquiry_kakao_deeplink_action", label: "문의 카톡 딥링크", category: "operations", default: true, description: "문의 상세에서 카톡 채팅 원클릭 열기 (kakaotalk://plusfriend/chat)" },
  { key: "morning_telegram_push", label: "아침 브리핑 텔레그램", category: "operations", default: false, description: "매일 아침 KPI + 마감 리스트를 텔레그램으로 자동 전송 (별도 cron)" },
  { key: "inquiry_next_action_chips", label: "문의 다음 액션 chips", category: "ux", default: true, description: "문의 상세 상단에 다음 권장 액션 chip (답장/견적/상담예약/거절)" },
  { key: "command_palette_new_dashboards", label: "command palette 신규 인덱싱", category: "ux", default: true, description: "9개 신규 dashboard가 command palette 검색에 노출" },
  { key: "inquiry_case_promote_oneclick", label: "문의→사건 원클릭 승격", category: "operations", default: true, description: "문의 상세에서 사건 원클릭 생성 + caseNo 자동 발급" },
  { key: "kakao_reply_template_autopick", label: "카톡 답변 템플릿 자동추천", category: "operations", default: true, description: "문의유형·상태 매칭하여 매크로 템플릿 자동 추천 (기존 macros 재활용)" },
  { key: "quote_conversion_tracking", label: "견적 승인율 트래킹", category: "marketing", default: false, description: "quote_id UUID 발급 → 승인/거절 추적 → 견적금액대별 win rate" },
  { key: "receivable_alert", label: "미수금 알림", category: "operations", default: true, description: "WON 후 30일+ 미입금 인보이스 자동 감지 (기존 payment-risk 활용)" },
  { key: "precedent_similar_search", label: "유사사례 검색", category: "operations", default: true, description: "사건유형별 최근 처분사례 검색 (/admin/precedents 재활용)" },
  { key: "ai_draft_citation_verify", label: "AI 초안 인용 검증", category: "operations", default: true, description: "citation-verifier-service로 법령·판례 인용 자동 검증 (기존)" },
  { key: "inquiry_trust_score", label: "문의 신뢰도 스코어", category: "operations", default: false, description: "블랙리스트/의심번호/의뢰이력 종합 → 우선순위 낮춤" },
  { key: "consult_noshow_predict", label: "상담 노쇼 예측", category: "operations", default: false, description: "과거 노쇼 이력 + 문의채널 조합 → 예상 노쇼율 표시" },
  { key: "blog_low_ctr_rewrite_queue", label: "블로그 저CTR 리라이트 큐", category: "marketing", default: false, description: "GSC CTR 하위 20% 글 자동 리라이트 큐에 적재 (기존 blog-performance cron)" },
  { key: "auto_review_request_naver", label: "네이버 리뷰 자동요청", category: "marketing", default: true, description: "WON 후 3일 KakaoAlimtalk로 네이버 플레이스 딥링크 발송 (기존 review_automation 확장)" },
  { key: "utm_conversion_heatmap", label: "UTM 전환 heatmap", category: "marketing", default: true, description: "UTM source×medium 매트릭스 → WON 전환율 heatmap (/admin/utm-heatmap)" },
  { key: "reengagement_6mo_auto", label: "재의뢰 6개월 자동감지", category: "operations", default: false, description: "WON 후 180d+ · 최근 90d 신규 없는 고객 텔레그램 알림 (cron: reengagement-6mo)" },
  { key: "gov_form_update_watch", label: "정부양식 업데이트 감시", category: "operations", default: false, description: "정부24/법령 양식 diff 감지 → 변경 시 알림 (Poli-admin 벤치마크)" },
  { key: "sidebar_badge_polling", label: "사이드바 뱃지 폴링", category: "ux", default: true, description: "5분 간격 미응답/미수금/D-7 count 실시간 표시 (/api/admin/sidebar-counts)" },
  { key: "blog_low_ctr_rewrite_queue_page", label: "블로그 리라이트 큐 페이지", category: "marketing", default: true, description: "/admin/blog-rewrite-queue GSC 저CTR 실시간 조회" },
  { key: "mentor_hub", label: "실무 멘토링 허브", category: "operations", default: true, description: "/admin/mentor 4개 훈련 도구 카드 그리드" },
  { key: "mentor_case_simulator", label: "사례 시뮬레이터", category: "operations", default: true, description: "AI 상담 시나리오 생성 + 답변 채점 (mentor/case-simulator)" },
  { key: "mentor_document_critique", label: "서면 첨삭", category: "operations", default: false, description: "AI rubric 기반 서면 첨삭 (준비 중)" },
  { key: "mentor_precedent_quiz", label: "판례 퀴즈", category: "operations", default: false, description: "판례 사실관계 → 결론 예측 훈련 (준비 중)" },
  { key: "mentor_client_roleplay", label: "클라이언트 롤플레이", category: "operations", default: false, description: "AI 클라이언트 역할 상담 훈련 (준비 중)" },
  { key: "legal_info_delivery_daily", label: "매일 법률정보 전달", category: "operations", default: false, description: "매일 아침 관심 카테고리 신법령·판례 요약 텔레그램 (별도 cron)" },
  { key: "empty_state_unified", label: "Empty state 통일", category: "ux", default: true, description: "EmptyState 공통 컴포넌트 (icon+title+desc+action)" },
  { key: "sidebar_group_collapse", label: "sidebar 그룹 접기", category: "ux", default: true, description: "sidebar 그룹 헤더 클릭으로 접기/펴기 (localStorage 유지)" },
  { key: "toast_quote_copy", label: "견적 복사 toast", category: "ux", default: true, description: "quote-calc 복사 시 react-hot-toast 알림" },
  { key: "dark_mode_manual_toggle", label: "다크모드 수동 토글", category: "ux", default: false, description: "라이트/자동/다크 3단 토글 UI (data-theme + localStorage)" },
  { key: "skeleton_cards_variant", label: "skeleton cards variant", category: "ux", default: true, description: "DashboardLoadingSkeleton에 cards variant 추가" },
  { key: "sidebar_cmdk_hint", label: "sidebar Cmd+K hint", category: "ux", default: true, description: "sidebar 하단에 Ctrl+K 단축키 안내" },
  { key: "quote_preset_from_inquiry", label: "견적 자동 프리셋", category: "operations", default: true, description: "quote-calc?inquiryId=xxx 지원. 사건유형·재의뢰 자동매핑" },
  { key: "legal_info_ai_summary", label: "법률정보 AI 요약", category: "operations", default: false, description: "매일 법률정보 cron에 Claude Haiku 요약 활성. 미활성 시 stub 링크만" },
  { key: "case_progress_visualization", label: "사건 진행률 시각화", category: "ux", default: true, description: "사건 상세 상단에 5단계 progress bar (접수→착수→제출→대기→종결)" },
  { key: "flag_audit_filters", label: "flag-audit 필터/검색", category: "ux", default: true, description: "flag-audit 페이지에 필터 chip + q 검색" },
  { key: "sidebar_quote_pending_badge", label: "sidebar 견적 승인대기 뱃지", category: "ux", default: true, description: "quote-calc 링크에 QUOTE_PENDING 문의 count 뱃지" },
  { key: "quote_pending_24h_reminder", label: "견적 24h+ 미승인 리마인더", category: "operations", default: false, description: "follow-up-reminder cron이 QUOTE_PENDING 24h 경과 문의에 이메일+텔레그램 발송" },
  { key: "quick_note_fab", label: "빠른 노트 FAB", category: "ux", default: true, description: "우하단 플로팅 노트 버튼 (Ctrl+/ 단축키, localStorage)" },
  { key: "kanban_progress_mini", label: "kanban 진행률 mini", category: "ux", default: true, description: "kanban 카드에 CaseProgressBar mini bar 표시 (labels 없이)" },
  { key: "weekly_kpi_email", label: "주간 KPI 이메일", category: "marketing", default: false, description: "매주 weekly-report cron이 ADMIN_ALERT_EMAIL로 KPI 리포트 발송 (WoW, WON, SLA 포함)" },
  { key: "kakao_first_message_preset", label: "카톡 첫 메시지 프리셋", category: "operations", default: true, description: "문의 상세에서 카톡 첫 메시지 클립보드 자동 복사 (name+title 프리셋)" },
  { key: "reply_draft_auto", label: "답장 초안 자동생성", category: "operations", default: true, description: "문의 상세에서 Claude Haiku 답장 초안 원클릭 생성 + 복사" },
  { key: "saved_filter_views", label: "필터 저장 (내 뷰)", category: "ux", default: true, description: "현재 URL 필터를 localStorage에 저장. inbox/cases 등에서 재사용" },
  { key: "inquiry_auto_labeling", label: "문의 자동 라벨링", category: "operations", default: false, description: "요구/공포/불만/문의 자동 태깅 (Haiku 분류, POST /api/admin/inquiries/{id}/labels)" },
  { key: "case_delay_detection", label: "사건 지연 감지", category: "operations", default: false, description: "matterType 평균 대비 +50% 지연 감지 + 텔레그램 알림. 매주 월요일 23:00 cron" },
  { key: "message_tone_adjust", label: "메시지 톤 조정 AI", category: "operations", default: true, description: "/admin/tone-tools에서 원문을 친근/공식/사과/안심 톤으로 재작성 (Haiku)" },
  { key: "inquiry_bulk_actions", label: "문의 배치 액션", category: "operations", default: true, description: "다중 문의 일괄 상태변경·담당자할당·읽음처리 (최대 50건)" },
  { key: "my_activity_timeline", label: "내 활동 timeline", category: "ux", default: true, description: "/admin/my-activity: 최근 40건 문의+사건+블로그 통합 timeline" },
  { key: "inquiry_similar_search", label: "유사 문의 검색", category: "operations", default: true, description: "/admin/similar-search: 자연어로 과거 문의 유사도 검색 (토큰 매칭)" },
  { key: "auto_status_on_first_response", label: "첫 응답 시 자동 상태전환", category: "operations", default: false, description: "NEW→CONSULTATION_REQUIRED 자동 (첫 응답 firstResponseAt 세팅 시)" },
  { key: "macro_hotkeys", label: "매크로 hotkey (Ctrl+1~9)", category: "ux", default: true, description: "Ctrl+1~9로 매크로 즉시 삽입/복사. /admin/macro-hotkeys에서 편집" },
  { key: "case_event_timeline", label: "사건 진행 timeline", category: "ux", default: true, description: "사건 상세 상단에 CaseEvent 최근 20건 timeline 표시" },
  { key: "hero_image_rotation", label: "히어로 이미지 로테이션", category: "marketing", default: false, description: 'SiteSetting "image.hero.rotation" JSON 배열을 일자별 순환. 미설정 시 기본 로고' },
  { key: "public_dark_mode_toggle", label: "public 다크모드 토글", category: "ux", default: false, public: true, description: "public footer에 라이트/자동/다크 토글" },
  { key: "returning_visitor_badge", label: "재방문자 배지", category: "marketing", default: true, public: true, description: '홈에서 재방문자에게 "지난번 본 서비스 이어보기" 칩 (localStorage, 30일)' },
  { key: "intake_progress_chip", label: "intake 필수항목 진행 칩", category: "ux", default: true, description: "접수 폼 상단 sticky 4단계 필수항목 완료 표시" },
  { key: "blog_mid_cta", label: "블로그 50% CTA", category: "marketing", default: true, public: true, description: "블로그 글 50% 스크롤 시 무료검토 슬라이드인 CTA (세션당 1회)" },
  { key: "reply_draft_variants", label: "답장 초안 3버전", category: "operations", default: true, description: "문의 답장 초안을 친근/공식/실무 3가지 톤으로 동시 생성" },
  { key: "gsc_rank_drop_alert", label: "GSC 순위 급락 알림", category: "marketing", default: false, description: "주 1회 최근 7일 vs 직전 7일 position 비교, 5계단+ 하락 시 텔레그램 (GSC env 필요)" },
  { key: "local_seo_landing", label: "지역 SEO 랜딩", category: "marketing", default: true, description: "/local/[region] — 서울 25구+수도권 주요 시 로컬 검색 랜딩 31개" },
  { key: "quote_to_case_auto", label: "견적 승인→사건 자동생성", category: "operations", default: false, description: "WON 전환 시 CaseMatter 자동 생성 (ETHOS-YYYY-NNN)" },
  { key: "inquiry_label_badge_inbox", label: "문의 라벨 배지 (inbox)", category: "ux", default: true, description: "inbox 목록에 자동 라벨링 결과 컬러 칩 표시" },
  { key: "case_delay_badge", label: "사건 지연 배지", category: "ux", default: true, description: "cases 목록에 30일+ 지연 사건 빨간 배지 표시" },
  { key: "deploy_status_monitor", label: "배포 상태 모니터링", category: "operations", default: false, description: "Vercel 배포 상태 모니터링 + 실패 시 텔레그램 알림 (VERCEL_TOKEN env 필요)" },
  { key: "deploy_status_card", label: "배포 상태 카드", category: "operations", default: true, description: "관리자 설정 페이지에 최근 배포 상태 표시" },
  { key: "reply_tone_ab_tracking", label: "답장 톤 A/B 추적", category: "marketing", default: false, description: "답장 톤 선택 → WON 전환 추적 (어느 톤이 계약 전환율 높은지)" },
  { key: "local_landing_nav", label: "지역 랜딩 네비 노출", category: "marketing", default: true, public: true, description: "홈페이지·사이드바에 지역 랜딩 링크 노출" },
  { key: "kakao_retry_auto", label: "카카오 알림톡 재시도", category: "operations", default: false, description: "카카오 알림톡 발송 실패 자동 재시도 (최대 3회)" },
  { key: "daily_dashboard_email", label: "일일 KPI 이메일", category: "operations", default: false, description: "매일 KPI 스냅샷 이메일 (ADMIN_ALERT_EMAIL env 필요)" },
  { key: "macro_server_sync", label: "매크로 서버 동기화", category: "operations", default: false, description: "매크로 hotkey 서버 저장 (기기간 동기화)" },
  { key: "kpi_email_chart", label: "KPI 이메일 차트", category: "operations", default: false, description: "일일 KPI 이메일에 7일 추이 차트 포함 (HTML table 기반)" },
  { key: "flag_dormancy_auto_detect", label: "Flag 미사용/중복 감지", category: "operations", default: true, description: "180개+ flag 중 미사용/중복 자동 감지 + flag-audit 페이지 표시" },
  { key: "blog_to_card_news", label: "블로그→카드뉴스", category: "marketing", default: false, description: "블로그 글→카드뉴스 이미지 자동 생성 (인스타/카카오용)" },
  { key: "case_close_story_draft", label: "사건종결 사례스토리 초안", category: "marketing", default: false, description: "사건 종결 시 AI 사례 스토리 초안 자동생성 (익명화)" },
  { key: "inquiry_blog_recommend", label: "답장 블로그 추천", category: "operations", default: true, description: "답장 초안에 관련 블로그 링크 자동 추천" },
  { key: "kakao_delivery_dashboard", label: "카카오 발송 대시보드", category: "operations", default: false, description: "카카오 알림톡 발송 성공/실패/재시도 통계 대시보드" },
  { key: "cron_dispatcher_mode", label: "Cron Dispatcher 통합", category: "operations", default: false, description: "40 cron → 1 dispatcher로 통합 (Hobby 제한 대비)" },
  { key: "blog_cross_post_naver", label: "블로그 자동 공유 (네이버)", category: "marketing", default: false, description: "네이버 블로그용 포맷 복사 기능" },
  { key: "weekly_pdf_report", label: "주간 리포트 자동 생성", category: "operations", default: false, description: "주간 운영 리포트 HTML 이메일 자동 발송" },
  { key: "case_fee_tracking", label: "사건 수임료 수금 추적", category: "operations", default: true, description: "사건별 수임료 수금 현황 추적 및 관리" },
  { key: "satisfaction_survey_auto", label: "고객 만족도 설문 자동 발송", category: "operations", default: true, description: "사건 종결 3일 후 고객 만족도 설문 자동 발송" },
  { key: "ga4_conversion_tracking", label: "GA4 전환 이벤트 추적", category: "marketing", default: true, description: "접수/전화/카톡/견적/상담폼 GA4 전환 이벤트 전송", public: true },
  { key: "prompt_ab_testing", label: "AI 프롬프트 A/B 테스트", category: "operations", default: false, description: "답장 초안 등 AI 생성 태스크에 프롬프트 변형(A/B) 적용 및 결과 로깅" },
  { key: "ga4_page_view_enhanced", label: "GA4 전환 이벤트 트래킹", category: "marketing", default: true, description: "GA4 page_view 향상 이벤트 + 스크롤 깊이 자동 추적", public: true },
  { key: "portal_timeline_live", label: "포털 타임라인 실데이터", category: "portal", default: true, description: "고객 포털 사건 타임라인에 CaseEvent 실데이터 표시" },
  { key: "reply_prompt_ab", label: "답장 프롬프트 A/B", category: "ai", default: false, description: "답장 초안 프롬프트를 formal/empathetic/solution-focused 중 해시 기반 선택" },
  { key: "email_template_manager", label: "이메일 템플릿 관리", category: "operations", default: true, description: "이메일 템플릿 관리 UI (/admin/email-templates)" },
  { key: "portal_survey_page", label: "고객 포털 설문 페이지", category: "portal", default: true, description: "종결 사건 만족도 설문 페이지 (/portal/survey/[caseId])" },
  { key: "blog_seo_auto", label: "블로그 SEO 자동 최적화", category: "marketing", default: true, description: "블로그 발행 시 메타/OG/JSON-LD 자동 생성" },
  { key: "case_doc_gen", label: "사건 문서 자동 생성", category: "operations", default: true, description: "위임장/영수증 등 사건 관련 서식 HTML 자동 생성 (window.print)" },
  { key: "admin_dashboard_v2", label: "관리자 대시보드 v2", category: "operations", default: true, description: "관리자 홈 KPI/7일 추이/긴급건/오늘 마감 리뉴얼 섹션" },
  { key: "survey_results_dashboard", label: "포털 설문 결과 대시보드", category: "operations", default: true, description: "포털 만족도 설문 응답 집계 (/admin/survey-results)" },
  { key: "case_doc_pdf", label: "사건 문서 PDF 다운로드", category: "operations", default: false, description: "위임장/영수증 인쇄 최적화 CSS + 자동 인쇄 다이얼로그 (PDF 저장)" },
  { key: "multi_org_mode", label: "멀티 사무소 모드", category: "platform", default: false, description: "orgId 기반 다중 사무소 데이터 격리 (scaffolding — 실제 필터 적용 전)" },
  { key: "site_content_editor", label: "웹페이지 콘텐츠 편집", category: "operations", default: true, description: "홈/서비스/푸터 주요 문구를 관리자 CMS(/admin/content-editor)에서 인라인 편집" },
  { key: "ai_prediction_accuracy", label: "AI 승소예측 정확도", category: "ai", default: false, description: "AI 승소 예측 신뢰도와 실제 결과 비교 트래킹" },
  { key: "blog_auto_translate", label: "블로그 자동 번역 실행", category: "marketing", default: false, description: "미번역 블로그 포스트 일괄 자동 번역 (EN/ZH)" },
  { key: "inquiry_label_retrain", label: "문의 라벨링 재학습", category: "ai", default: false, description: "자동 라벨링 정답/오답 피드백을 축적해 프롬프트 튜닝에 활용" },
  { key: "org_onboarding_wizard", label: "사무소 온보딩 마법사", category: "platform", default: true, description: "신규 사무소 다단계 온보딩 위저드" },
  { key: "seo_audit", label: "사이트 SEO 감사", category: "marketing", default: true, description: "URL 입력 시 SEO 요소(타이틀·메타·H1·OG·JSON-LD) DIY 감사" },
  { key: "ab_test_gui", label: "A/B 테스트 GUI", category: "marketing", default: true, description: "A/B 실험 목록·통계·일시정지·신규 실험 생성 UI" },
  { key: "cms_extended", label: "CMS 키 확장", category: "operations", default: true, description: "서비스 페이지·소개·연락처 등 30+ 콘텐츠 키 노출" },
  { key: "cms_image_upload", label: "CMS 이미지 업로드", category: "operations", default: true, description: "히어로 배경·인물·서비스 배경 이미지를 CMS에서 업로드/교체" },
  { key: "cms_section_order", label: "CMS 섹션 순서", category: "operations", default: false, description: "홈페이지 섹션 순서를 관리자에서 재정렬 (scaffolding)" },
  { key: "cms_preview", label: "사이트 편집 미리보기", category: "operations", default: true, description: "저장 전 오버라이드 값으로 홈페이지 섹션 미리보기 (/admin/content-editor/preview)" },
  { key: "cms_history", label: "편집 히스토리·롤백", category: "operations", default: true, description: "콘텐츠 편집 이력 최근 10건 저장 및 롤백" },
  { key: "cms_editor_role", label: "편집 권한 세분화", category: "operations", default: false, description: "cms_editor_emails 목록의 사용자에게 콘텐츠 편집 권한 위임" },
  { key: "marketing_guideline_scanner", label: "마케팅 지침 위반 감지", category: "operations", default: true, description: "v6.4 마케팅 지침(과대광고·CTA 규정) 위반 문구 자동 감지 및 대체 제안" },
  { key: "cta_copy_v64", label: "CTA 카피 소재별 매핑 (v6.4)", category: "marketing", default: true, description: "카테고리별 CTA 헤드라인·버튼 문구 자동 매핑 (v6.4 10-2)" },
  { key: "urgency_badge_gate", label: "긴급 뱃지 소재 게이트 (v6.4)", category: "marketing", default: true, description: "진짜 기한이 있는 소재(비자·행정심판)에만 긴급 뱃지 노출 (v6.4 9-6)" },
  { key: "auto_disclaimer", label: "블로그 면책 문구 자동 삽입 (v6.4)", category: "marketing", default: true, description: "블로그 발행 시 법령 정보 제공 면책 문구 자동 삽입 (v6.4 8-6)" },
  { key: "cost_frame_check", label: "비용 3단 구조 검증 (v6.4)", category: "operations", default: true, description: "블로그에 비용·만원 언급 시 범위·조건·개별확인 3요소 존재 검증 (v6.4 8-8-2)" },
  { key: "marketing_guideline_doc", label: "마케팅 지침 문서 관리", category: "operations", default: true, description: "마케팅 지침(v6.4~) 문서를 관리자에서 편집·버전 관리 (/admin/marketing-guideline)" },
  { key: "ai_draft_guideline_check", label: "AI 초안 지침 검증", category: "ai", default: true, description: "AI 초안을 마케팅 지침 스캐너에 통과시켜 위반 문구 감지 (/admin/ai-draft-check)" },
  { key: "guideline_prompt_inject", label: "지침 프롬프트 자동 주입", category: "ai", default: true, description: "AI 초안 생성 시 마케팅 지침 문서 요약을 시스템 프롬프트에 자동 첨부" },
  { key: "admin_hide_mode", label: "감춤 모드 (사이드바 티어 필터)", category: "operations", default: true, description: "관리자 사이드바를 tier(핵심/자주/가끔/드묾)로 필터링하여 인지 부하 감소" },
  { key: "admin_show_advanced", label: "고급 페이지 표시", category: "operations", default: false, description: "감춤 모드에서 advanced tier 페이지까지 노출 (기본은 core만)" },
  { key: "intake_form_autosave", label: "접수 폼 자동저장", category: "ux", default: true, description: "접수 폼 작성 중 자동 저장 및 복구 (localStorage)", public: true },
  { key: "dynamic_cta_labels", label: "동적 CTA 문구", category: "ux", default: false, description: "시간대·디바이스에 따라 CTA 버튼 문구 자동 변경", public: true },
  { key: "intake_ai_prescreen", label: "AI 사전 심사", category: "ai", default: false, description: "문의 접수 후 AI가 긴급도·예상 회신시간·추천 채널 자동 판정" },
  { key: "morning_priority_sort", label: "아침 우선순위 자동정렬", category: "operations", default: true, description: "아침 브리핑에 우선순위 스코어 기반 오늘 할 일 섹션" },
  { key: "auto_case_suggest", label: "사건 전환 자동 제안", category: "operations", default: true, description: "견적 수락 후 또는 대화 3회+ 진행 시 사건 전환 배너 표시" },
  { key: "context_aware_reply_draft", label: "맥락 인식 답장 초안", category: "ai", default: true, description: "문의 언어·채널에 따라 답장 초안 톤과 언어 자동 조정" },
  { key: "lead_scoring_dashboard", label: "리드 스코링 대시보드", category: "marketing", default: false, description: "채널·카테고리별 수임률 분석 대시보드 (/admin/lead-scoring)" },
  { key: "public_trust_dashboard", label: "공개 운영 현황", category: "marketing", default: false, description: "공개 운영 현황 페이지 — 진행 사건·응답시간·완료 건 (/status)", public: true },
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
