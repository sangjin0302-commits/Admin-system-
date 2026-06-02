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
- 운영 메모: `OPERATIONS.md`
- 보안 가이드: `docs/security-hardening.md`
- 인코딩 무결성: `docs/encoding-integrity.md`

### Runbooks

- Document Lab readiness: `docs/runbooks/document-lab-readiness.md`
- Document template official source verification: `docs/runbooks/document-template-official-source-verification.md`
- Document Lab source work queue: `docs/runbooks/document-lab-source-work-queue.md`
- Case accounting follow-up: `docs/runbooks/case-accounting-follow-up.md`
- Immigration due date sync QA: `docs/runbooks/immigration-due-date-sync-qa.md`
