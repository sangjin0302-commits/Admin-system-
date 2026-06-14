# ETHOS 배포 가이드

## 1. 사전 준비

- 도메인 (예: ethos.kr) — 가비아 / 후이즈 / 카페24 등
- GitHub 저장소 (이미 있음)
- 이메일 발송 계정 (Resend 권장)

## 2. 데이터베이스 — Railway PostgreSQL

```
1. railway.app 가입 → New Project → Add Service → Database → PostgreSQL
2. 생성된 Postgres 서비스 → Variables 탭에서 DATABASE_URL 복사
   (형식: postgresql://user:pass@host:port/db)
3. 로컬 .env 에 잠시 그 값을 DATABASE_URL=... 로 넣어 push 실행:
   npm run db:push:postgres
   → prisma/schema.postgresql.prisma 기준으로 테이블 전체 생성됨
4. 생성 확인 후 Railway Variables에 영구 등록 (다음 단계 Vercel에서도 동일 값 사용)
```

env 키 (Vercel/Railway 동일):
```
PRISMA_DB_PROVIDER=postgresql
DATABASE_URL=postgresql://...
```

### 적용되는 신규 모델 (자동 포함됨)
- `PortalClient`, `PortalUploadedFile` — 의뢰인 포털
- `AdminAppealDetail`, `ContractInvestigationDetail`, `LicensePermitDetail` — 4 카테고리
- `CaseMatter.category`, `Inquiry.intakeCategory`, reset 토큰 컬럼 등

## 2-1. 파일 저장소 — Cloudflare R2 (권장) 또는 AWS S3

Vercel은 서버리스라 로컬 디스크가 휘발됨 → 외부 스토리지 필수.

### Cloudflare R2 (egress 무료, 추천)
```
1. dash.cloudflare.com → R2 → Create bucket: ethos-uploads
2. R2 → API Tokens → Create API Token (Object Read & Write)
3. 받은 값을 Vercel env 등록:
   STORAGE_DRIVER=s3
   S3_BUCKET=ethos-uploads
   S3_REGION=auto
   S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
   S3_ACCESS_KEY_ID=...
   S3_SECRET_ACCESS_KEY=...
   S3_PREFIX=portal-uploads
```

### AWS S3
```
1. S3 콘솔 → 버킷 생성 (서울: ap-northeast-2)
2. IAM 사용자 생성 → AmazonS3FullAccess (또는 특정 버킷만 권한)
3. Access Key 발급 → Vercel env:
   STORAGE_DRIVER=s3
   S3_BUCKET=ethos-uploads
   S3_REGION=ap-northeast-2
   S3_ENDPOINT=    (비움)
   S3_ACCESS_KEY_ID=...
   S3_SECRET_ACCESS_KEY=...
   S3_PREFIX=portal-uploads
```

스토리지 키 미설정 시 자동으로 로컬 디스크 fallback (개발 환경용).

## 3. 앱 배포 — Vercel

```
1. vercel.com 가입 → GitHub 연결
2. Import Project → Admin-system 저장소 선택
3. Framework: Next.js 자동 감지
4. Environment Variables 입력 (아래 표)
5. Deploy
```

### Vercel 환경 변수 (필수)

| 키 | 예시 | 비고 |
|---|---|---|
| `DATABASE_URL` | Railway URL | Postgres |
| `ADMIN_BASIC_AUTH_USER` | admin | 관리자 인증 |
| `ADMIN_BASIC_AUTH_PASSWORD` | 14자 이상 강력한 패스워드 | |
| `ADMIN_MARKETING_SYNC_TOKEN` | 24자 이상 랜덤 | |
| `NEXT_PUBLIC_SITE_URL` | https://ethos.kr | sitemap/canonical |
| `NOTIFICATION_PROVIDER` | `resend` 또는 `none` | |
| `RESEND_API_KEY` | re_xxx | Resend 가입 후 |
| `RESEND_FROM` | noreply@ethos.kr | 도메인 검증 필요 |

### Vercel 환경 변수 (선택)

| 키 | 비고 |
|---|---|
| `NEXT_PUBLIC_GA_ID` | G-XXXXXX (Google Analytics 4) |
| `NEXT_PUBLIC_NAVER_ID` | 네이버 웹마스터 도구 ID |
| `LAWBOT_ANALYZE_URL` | lawbot 분석 서버 URL (선택) |

## 4. 도메인 연결

```
1. Vercel 프로젝트 → Settings → Domains → ethos.kr 추가
2. 도메인 등록기관 DNS 설정:
   - A 레코드: @ → 76.76.21.21
   - CNAME: www → cname.vercel-dns.com
3. SSL 자동 발급 대기 (5분 ~ 30분)
```

## 5. 카카오톡 채널 연동

```
1. 카카오 비즈니스 (business.kakao.com) 가입
2. 채널 생성 → ETHOS 행정사사무소
3. 채널 URL 받기 (예: pf.kakao.com/_xxx)
4. src/components/layout/floating-contact.tsx
   - href="http://pf.kakao.com/_xXxXxXx" → 실제 URL로 변경
5. src/components/layout/public-footer.tsx 도 동일
```

## 6. 이메일 발송 (Resend)

```
1. resend.com 가입
2. Domains → ethos.kr 추가
3. DNS TXT/MX 레코드 등록 (안내대로)
4. API Keys → 새 키 발급 → RESEND_API_KEY 에 저장
5. NOTIFICATION_PROVIDER=resend
```

## 7. Google / Naver 검색 등록

```
Google Search Console:
1. search.google.com/search-console
2. 속성 추가 → ethos.kr
3. DNS TXT 검증
4. 사이트맵 제출: https://ethos.kr/sitemap.xml

네이버 서치어드바이저:
1. searchadvisor.naver.com
2. 사이트 추가 → 검증
3. 사이트맵 제출
```

## 8. 배포 후 체크리스트

- [ ] / 첫 화면 정상 로드
- [ ] /admin Basic Auth 작동
- [ ] /intake 폼 제출 → DB 저장 확인
- [ ] /track?code=... 접수번호 조회 가능
- [ ] /sitemap.xml 접근 가능
- [ ] /robots.txt 접근 가능
- [ ] 카카오톡 floating 버튼 → 채널로 이동
- [ ] 전화 버튼 → tel: 작동
- [ ] 모바일 화면 적절히 표시
- [ ] HTTPS 정상 작동 (자물쇠)
- [ ] Vercel 함수 로그에서 에러 없음

## 9. 운영 후 보강할 것

- 카카오 알림톡 연동 (NHN Cloud / 솔라피)
- PDF 자동 생성 (계약서 / 조사보고서)
- 의뢰인 포털 로그인 (NextAuth)
- 결제 연동 (토스 / 카카오페이)
- 백업 / 모니터링 (Sentry, Better Stack)
