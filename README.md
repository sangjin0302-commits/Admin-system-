# Admin System (Case-Centered Office Ops)

한국 행정사무소 내부용 사건 운영 시스템입니다.  
핵심은 수금 관리가 아니라 `사건 생성 → 문서 준비 → 제출/보완 → 종결` 흐름 관리입니다.

## 주요 기능
- 공개 접수 페이지: `/intake`
- 관리자 운영 화면: `/admin`
- 사건 카드/필수자료/태스크 중심 운영 화면
- 장부/수임관리 read-only 요약, 필터, CSV export safety
- 문서 실험실: `/admin/document-lab` read-only inventory, readiness, official source work queue
- 사건 분석/체크리스트/견적/운영 메모
- Lawbot 및 Marketing 연동 준비 구조
- 운영 점검 화면: `/admin/monitoring`

## 빠른 시작
```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

주요 경로:
- 접수 화면: `http://localhost:3000/intake`
- 관리자 화면: `http://localhost:3000/admin`

## 보안 기본값
`/admin/*`, `/api/admin/*`는 `middleware.ts`에서 Basic Auth로 보호됩니다.

필수 환경변수:
- `ADMIN_BASIC_AUTH_USER`
- `ADMIN_BASIC_AUTH_PASSWORD`
- `ADMIN_MARKETING_SYNC_TOKEN`

권장:
- `ADMIN_MIN_PASSWORD_LENGTH=14` 이상
- `ADMIN_MARKETING_SYNC_TOKEN_MIN_LENGTH=24` 이상

## 검증 명령
- 기본 검증: `npm run verify`
- 운영 환경변수 점검: `npm run ops:env:check`
- 외부 대상 스모크: `npm run ops:smoke`
- 로컬 스모크(로컬 서버 실행 후): `npm run ops:smoke:local`
- 통합 운영 검증: `npm run verify:ops`

## 데이터베이스
- 로컬 기본: SQLite
- 운영 권장: Railway Postgres

운영 백업/PITR 기준은 `docs/railway-postgres-operations.md`를 참고하세요.

## 문서
- 제품 비전/로드맵: `docs/admin-system-product-vision.md`
- HWP/HWPX template pipeline: `docs/hwp-hwpx-template-pipeline-plan.md`
- 문서 template inventory: `docs/document-template-inventory.md`
- Public website 3D brand entrance plan: `docs/public-website-3d-brand-entrance.md`
- Open-source/OSS upgrade reference: `docs/oss-upgrade-roadmap.md`
- Notion integration strategy: `docs/notion-integration-strategy.md`
- Notion schema mapping snapshot: `docs/notion-schema-mapping-snapshot.md`
- Notion safe summary export design: `docs/notion-export-safe-summary-design.md`
- Notion export dry-run route contract: `docs/notion-export-dry-run-route-contract.md`
- 운영 메모: `OPERATIONS.md`
- 보안 가이드: `docs/security-hardening.md`
- 인코딩 무결성: `docs/encoding-integrity.md`

### Runbooks

- Document Lab readiness: `docs/runbooks/document-lab-readiness.md`
- Document template official source verification: `docs/runbooks/document-template-official-source-verification.md`
- Document Lab source work queue: `docs/runbooks/document-lab-source-work-queue.md`
- Case accounting follow-up: `docs/runbooks/case-accounting-follow-up.md`
- Immigration due date sync QA: `docs/runbooks/immigration-due-date-sync-qa.md`

---

## 운영 가이드

실제 사무소 운영 관점에서의 점검 루틴입니다. 시스템이 살아 있는지 매일/매주/매월 확인하는 흐름을 정리했습니다.

### 첫 배포 후 해야 할 일

배포 직후 5단계입니다. 순서대로 진행하세요.

1. ✅ **환경변수 점검** — `npm run ops:env:check`로 운영 키 누락 확인. 특히 `ADMIN_BASIC_AUTH_*`, `ADMIN_MARKETING_SYNC_TOKEN`은 반드시 강한 값으로 교체.
2. ✅ **DB 마이그레이션·시드** — `npm run db:setup` 후 `/admin`에 접속해서 로그인 가능 여부 확인. 로그인 안 되면 환경변수 재확인.
3. ✅ **초기 데이터 입력** — `SEED_DATA_GUIDE.md` 참고. 최소 SiteSetting / FeeItem / Credential 3개 테이블은 채워야 공개 페이지가 정상 동작합니다.
4. ✅ **스모크 테스트** — `npm run ops:smoke`로 외부 접속, `/intake` 폼 제출, `/admin` 로그인까지 한 번씩 수행.
5. ⚠️ **백업 설정 확인** — Railway Postgres PITR 활성화 + `docs/railway-postgres-operations.md` 기준 점검. 백업 없이 운영 시작 금지.

### 관리자 일일 점검 (3분 모닝 루틴)

매일 아침 사무소 출근 직후 3분이면 됩니다.

1. ✅ `/admin` 로그인 → 신규 접수(intake) 건수 확인.
2. ✅ `/admin/monitoring` → 어제 24시간 에러/장애 알림 확인. ❌ 빨간 표시 있으면 즉시 `OPERATIONS.md` 응급 대응.
3. ✅ 카카오톡/이메일 미응답 문의 확인.

### 주간 점검 (매주 월요일 권장)

- ✅ 지난 주 사건(Case) 진행 상태 검토 — 정체된 사건 없는지 확인
- ✅ `/admin/document-lab` readiness 큐 확인 — 누락 문서 정리
- ✅ 백업 성공 로그 확인 (Railway 대시보드)
- ✅ 신규 후기/리뷰 들어왔는지 확인 → Testimonial 등록 검토
- ✅ 환경변수·API 키 만료 예정 확인 (Google, Notion, Kakao)
- ⚠️ 에러 로그 누적량 검토. 같은 에러가 반복되면 근본 원인 추적.

### 월간 점검 (매월 1일 권장)

KPI 리뷰 중심입니다.

- ✅ 이번 달 신규 접수 건수 vs 지난 달 비교
- ✅ 사건 평균 처리 일수 추세
- ✅ 매출/수임 요약 (장부 read-only) 검토
- ✅ 블로그 포스트 발행 수 확인 (목표: 월 4건)
- ✅ 검색 유입 키워드 점검 (Google Search Console)
- ✅ 시스템 비용(호스팅·DB·외부 API) 사용량 점검
- ⚠️ 보안 패치 / 의존성 업데이트 (`npm audit`) — 위험 등급 high 이상은 즉시 조치.

### 응급 시 대응

| 증상 | 1차 확인 | 조치 |
|---|---|---|
| ❌ `/admin` 로그인 불가 | 환경변수 `ADMIN_BASIC_AUTH_*` 확인 | Railway/Vercel 대시보드에서 값 재설정 후 재배포 |
| ❌ `/intake` 폼 제출 500 | `/admin/monitoring` 에러 로그 | DB 연결 문자열 확인, `npm run db:setup` 재실행 |
| ⚠️ 페이지가 갱신 안 됨 | Next.js 캐시 | 재배포 또는 `revalidate` 트리거 |
| ❌ 카카오톡 알림 미전송 | `kakaoUrl` SiteSetting, 토큰 만료 | Kakao Business 콘솔에서 토큰 갱신 |
| ❌ 이메일 발송 실패 | SMTP 환경변수, 발송 한도 | SMTP 자격 재발급, 일일 한도 확인 |
| ⚠️ DB 응답 느림 | Railway 메트릭, 인덱스 | 슬로우 쿼리 확인, 필요 시 인덱스 추가 |
| ❌ 사이트 전체 다운 | 호스팅 상태, DNS | Vercel/Railway 상태페이지 확인, 직전 배포 롤백 |

⚠️ **공통 원칙**: 응급 상황에서도 먼저 `OPERATIONS.md` 확인 → 본인 판단 어려우면 직전 배포로 롤백 → 그 다음 원인 추적. 사용자에게 보이는 시간을 최소화하는 것이 최우선.

