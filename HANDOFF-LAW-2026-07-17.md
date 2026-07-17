# 인수인계 — 법제처 API 통합 · 시장분석 흡수 (2026-07-17)

> 프로젝트 전반은 `HANDOVER.md` / `HANDOFF.md` 참고. 이 문서는 **법률 API 통합과 외부 연동 정리** 작업분.
> 새 세션에서 이 문서만 읽으면 이어서 작업 가능.

---

## 0. 한 줄 요약

법제처 API **83 target 실동작**(프로덕션 헬스체크 실패 0) + 생활법령 20함수 + **AI 인용 환각 검증**까지 검증 완료. 죽은 외부 연동(lawbot UI / market-analyze) 제거했고, 시장분석은 admin에 흡수 중.

---

## 1. 접속 · 환경

```
https://ethosattorney.com/admin
Basic Auth: sangjin0302 / arabica0302?!     ← 대화에 평문 노출됨, 교체 권장
```

| | |
|---|---|
| Vercel | `prj_TdKYyeXInz4lwUEi1gcycCYYBWi1` / 팀 `team_KQyZosmlEvdSwYQMFJiTWLyd` |
| 레포 | `sangjin0302-commits/Admin-system-` · `main` push → 자동배포 2~4분 |
| DB | Railway PostgreSQL — **꺼지면 admin 전체 죽음** |
| 프록시 | Lightsail `3.36.175.81:8080` — 법제처 IP 화이트리스트 우회. **$3.50/월, 유일한 고정비** |

### 필수 env (Vercel — **전부 Production 체크**)
```
ADMIN_BASIC_AUTH_USER / ADMIN_BASIC_AUTH_PASSWORD
ADMIN_MIN_PASSWORD_LENGTH=10      # 기본 14, 현재 비번 13자라 낮춤
LAW_PROXY_URL=http://3.36.175.81:8080
LAW_PROXY_TOKEN=e0848e2f031ef16ca36a12ccc7339b17ecdce75c54818e08
LAW_OC=sangjin_api
EASYLAW_KEY=fd9413d13fff790c61c4daf070634543a32a80adb83d13b8f7f274d4fab41154
NAVER_CLIENT_ID / NAVER_CLIENT_SECRET    # 시장분석용 — market-analyze .env 에 있음, 옮겨야 함
CRON_SECRET / DATABASE_URL / ANTHROPIC_API_KEY
```
> ⚠️ **Vercel은 env 추가해도 자동 재배포 안 함.** 재배포해야 반영됨.

---

## 2. 만든 것

### 법제처 DRF — `src/lib/services/law-api-service.ts`
- **85 target 레지스트리 (지원 83)**, 전부 라이브 실측
- 엔드포인트는 `lawSearch.do` / `lawService.do` **2개뿐**. `target` 파라미터로 도메인 구분
- **wrapper/itemKey가 target마다 제각각** (`Expc` vs `ExpcSearch`, itemKey가 한글인 것도 3개)
- 부처별 유권해석 **38개** — 규칙: `{부처영문약칭}CgmExpc`
- **별표·서식**: 검색 결과에 `별표서식파일링크`(HWP) / `별표서식PDF파일링크` **직접 포함**
- **`aiSearch`**: 검색 응답에 **조문 본문** 담는 유일한 target
- 프로덕션 헬스체크 → **ok 65 / empty 18 / 실패 0**

### 생활법령 easylaw — `src/lib/services/easylaw-service.ts`
- SOAP. **IP 화이트리스트 없음 → Vercel 직접 호출** (프록시 불필요)
- 20함수: 통합검색(6카테고리) + LifeLawInfoService 12 + 영문 생활법령 3 + 백문백답 3
- **DRF보다 나은 점**: 검색 단계에서 **판시사항·판결요지 전문**을 줌
- 일일 100건/기능 → 24h 캐시 필수
- ⚠️ `LifeLawInfoService`에 **페이징 파라미터 넣으면 HTTP 500** (`baseRequestVO` 미상속). 페이징은 `getSearchAllKeywordList`에만
- ⚠️ lawbot의 `search_mqna`는 **WSDL에 없는 오퍼레이션**을 호출해 500 — 우리는 올바른 3개로 재구현

### AI 인용 검증 — `src/lib/services/citation-verify-service.ts` ⭐
의존성 0. AI가 지어낸 조문 인용을 잡음.
- L1: 정규화 후 연속 30자+ 공통 substring / L2: 문자 bigram Jaccard ≥ 0.25
- **프로덕션 실증**:
  ```
  ✓ 출입국관리법 제24조                     실존
  ✗ 출입국관리법 제99조의2 "외국인 등록 면제"  → 실제 "난민에 대한 형의 면제"
  ✗ 민법 제750조 "계약 해제"                → 실제 "불법행위의 내용"
  ```
- `case-research` AI 요약 직후 자동 실행 → 불일치 시 요약 본문에 ⚠️ 삽입

### 사건 자동 리서치 — `src/lib/services/case-research-service.ts`
문의/사건 상세 → **버튼 클릭** → AI 키워드 추출 → 10개 병렬 조회 → AI 4섹션 종합 → 인용 검증
`autoRun=false`, 사건당 ~15원, 1시간 캐시

### 에러 투명화 · 헬스체크 · 잠금
- `searchTargetDetailed` → `ok / empty / not_permitted / unknown_target / env_missing / upstream_error / parse_error`
- **`parse_error`가 실제 wrapper 키를 메시지에 담음** → 배포 첫날 `lsRlt` 버그 즉시 발견
- **실패는 캐시 안 함** (전엔 `catch`의 `[]`가 24h 박혔음)
- `law-health-service.ts` — 주1회 cron(`weekly-batch`)이 83 target 전수 실호출
- `law-registry-lock.ts` — **LOCKED_AT `2026-07-17`, LOCKED_SPECS 83개**, drift 감지 → UI 빨간 배너

---

## 3. 🔴 반드시 알아야 할 함정

### ① 법제처는 "틀렸다"는 신호를 안 준다
| 상황 | 응답 |
|---|---|
| 존재하지 않는 target | **빈 200** |
| 미신청 target | **빈 200** (웹 UI엔 안내 뜨지만 API로는 안 옴) |
| 진짜 결과 0건 | **빈 200** |

프록시 뒤에선 셋이 `raw_len=0`으로 **완전 동일**. JSON·XML·HTML 전부.
→ **빈 응답만으로 원인 단정 금지.**

### ② 유령 target 이름 5건 (전부 lawbot `_lib.py` 유래, 검증된 적 없음)
```
ccourt  → detc     헌재결정례
nodong  → nlrc     노동위원회 (39,363건)
acrc    → acr      국민권익위
empins  → eiac     고용보험심사위 (실업급여 40건)
mow     → mogef    성평등가족부 (부처명 개명)
```
추가: `mofCgmExpc` = **해양수산부** (기재부는 `moefCgmExpc` 별도) — 라벨 오류였음.
**lawbot 소스를 신뢰하지 말 것.**

### ③ env를 모듈 top-level 상수로 읽지 말 것
```ts
const LAW_PROXY_TOKEN = process.env.LAW_PROXY_TOKEN || "";        // ❌
function lawProxyToken() { return process.env.LAW_PROXY_TOKEN || ""; }  // ✅
```
Vercel 빌드 캐시가 파일 미변경 시 재사용 → **빈 값 고착** → 전 기능 `[]`. 이걸로 오래 헤맴.

### ④ 한글 검색어는 charset 명시 필수
```bash
-H "Content-Type: application/json" -d '{"keyword":"출입국관리법"}'           # ❌ CP949로 깨짐
-H "Content-Type: application/json; charset=utf-8" --data-binary @file.json  # ✅
```
이것 때문에 "코드가 안 된다"고 오판했음.

### ⑤ 삭제 시 과잉 삭제 주의
`/api/admin/marketing/` 엔 market-analyze와 **무관한 admin 자체 기능**이 섞여 있음
(instagram·podcast·shorts·seo-audit·heatmap·naver-kin·reengagement·competitors·utm·youtube).
실제로 디렉토리째 지웠다가 13개 복구했음. `ingest`/`overview` 2개만 제거 대상.

---

## 4. 진행 중 / 남은 일

### ✅ market-analyze 흡수 — 코드 완료, **배포 전 2단계 남음**

Railway(Python FastAPI+Celery+PG) 종료하고 admin이 네이버 API 직접 호출. **IP 제한 없어 프록시조차 불필요 → 비용 $0.**

#### 🔴 반드시 먼저 할 것 (안 하면 화면이 빈 상태)
```bash
# 1. 프로덕션 DB에 테이블 생성
npm run db:push:postgres
```
> ⚠️ `npx prisma migrate dev` 아님! 이 프로젝트는 **듀얼 스키마**:
> `schema.prisma`(마스터, sqlite provider) → `scripts/render-prisma-schema.mjs` → `schema.sqlite.prisma` / `schema.postgresql.prisma`
> 렌더 확인 완료 — 3개 모델이 postgresql 버전에 반영됨.

```
# 2. Vercel env 추가 (Production 체크) 후 재배포
NAVER_CLIENT_ID / NAVER_CLIENT_SECRET     ← market-analyze .env 에 있음, 옮길 것
NAVER_DATALAB_CLIENT_ID / _SECRET         ← 없으면 위 값으로 fallback
```

#### 만든 것
```
market-naver-client.ts        Search + DataLab, <b> 태그 제거, env는 호출 시점 읽기
market-classifier-service.ts  키워드 테이블 원본 그대로. 순수함수 (테스트 가능)
market-collect-service.ts     수집 / 경쟁사 프로파일 / 트렌드 / 대시보드, 동시성 4
market-report-service.ts      AI 리포트 — 버튼 클릭 시만, 1h 캐시, v6.4 가드레일
api/cron/market-collect       content-sync 그룹 편입 (vercel.json 추가 없음)
api/admin/market              7 액션
admin/market + market-panel   경쟁사 탭 주력
Prisma: MarketDocument / MarketCompetitor / MarketTrendSnapshot
Flags: market_collect / admin_market_analysis / market_ai_report
```

#### 알아둘 것
- **배열은 `String`(JSON 문자열)** — 마스터 schema가 sqlite provider라 `String[]`/`Json`이 검증 실패. 파일 기존 컨벤션과 동일
- **경쟁사 식별은 `docType`이 아니라 `competitorName`(발행자 기반)** — 원본 Python이 `QUESTION_HINTS`를 먼저 검사해서 "상담" 포함 글은 상담글로 분류됨. 내 최초 설계가 틀렸고 self-test가 잡음
- `kiwipiepy`(형태소) → 정규식 토큰 추출로 대체
- **기존에 수동 큐레이션 경쟁사 트래커가 `SiteSetting`에 따로 있음** — 자동 수집분과 데이터·메커니즘이 달라 충돌은 없으나 나중에 통합 검토할 것
- **UI 미검증** — 테이블 생성 전이라 렌더 못 해봄. 쿼리는 try/catch→empty라 빈 화면으로 degrade됨. 마이그레이션 후 "지금 수집" 눌러서 확인할 것

원본 소스 발췌본 (세션 종료 시 사라짐 — 필요하면 레포 `sangjin0302-commits/market-analyze`에서 재취득):
```
scratchpad/ma_naver.py / ma_classifier.py / ma_filters.py
scratchpad/ma_competitor_autodiscovery.py / ma_collector_v2.py / ma_models.py
```

### ⏸️ Phase 3 — lawbot 코어 제거 (보류)
~85 파일: bridge client / case-workflow / review / case-analysis / **견적 엔진 연동** / inquiry-detail 12개 / Notion 동기화 / API 10개 / `CaseAnalysisRun` 모델.

**서두르지 말 것.** `LAWBOT_BRIDGE_BASE_URL` env 없으면 import조차 안 되는 죽은 코드 → **비용 0, 피해 0**. 견적·문의가 깨지는 게 훨씬 큰 손해.

### 📞 법제처 문의 (02-2109-6446)
> "감사원 사전컨설팅 의견서, 통일부 법령해석의 OPEN API target 파라미터 값이 뭔가요?"

신청 화면엔 체크돼 있는데 이름을 못 찾음. 후보 15종(`bai`·`baiConsult`·`baiCnslt`·`preConsult`·`unikoreaCgmExpc`…) 전부 빈 응답.

### 🌐 브라우저 UI 미확증
서버 HTML엔 패널이 다 들어있음(53KB, 검색창·버튼 DOM 확인). 근데 Claude 브라우저 pane에서 Suspense가 안 풀림(`<!--$~-->` pending). pane 자체가 세션 내내 불안정(screenshot timeout 연발) → **pane 한계인지 진짜 버그인지 미확정**.
→ **실제 Chrome에서 `/admin/law-research` 열어볼 것.** 스피너에서 멈추면 admin layout의 `await` 3개(`listInquiries` 등) 의심.

### 기타
- **admin에 고객용 "무료 검토 요청" 모달이 뜸** — exit-intent 모달이 admin 경로에서도 렌더
- 미지원 2 target: `lstrmRlt`, `dlytrmRlt` (법령용어 연계 — 이름 미확인)

---

## 5. 비용

| | |
|---|---|
| Lightsail nano | **$3.50/월** — 유일한 고정비 |
| Vercel Hobby / 법제처 / easylaw / 네이버 | **$0** |
| **AI** | **상시 지출 0** |

AI 트리거 (전부 클릭/요청 기반):
- admin AI 7개(답장초안·톤조정·라벨링·카드뉴스·멘토3) → 버튼
- 사건 자동 리서치 → 버튼, 15원/건
- cron AI → `legal-info-daily` **1개**, 하루 1회
- 블로그 요약 → **7일 캐시**(콘텐츠 md5) — 유일한 페이지로드 자동이었으나 차단
- `smartInvoke` 1h 캐시 + AI FAQ 프리캐시(18패턴)

**cron 41개 → 8개 배치 그룹** (`cron-dispatcher-service.ts`). 신규 cron은 기존 그룹에 편입할 것.

---

## 6. 고객 경로 — 절대 확장 금지

`/law-lookup` 은 **의도적으로 최소 기능**:
```
PUBLIC_ALLOWED_TARGETS = law / prec / expc  (3개 고정)
PUBLIC_LIMITS = 법령 3 / 판례 3 / 해석례 2
AI 없음 · 본문·요지 미노출 · 파일 링크 미노출 · 상세조회 금지
IP당 3회/일 · 상하단 면책 + 상담 CTA
```
**금지**: `aiSearch`(조문 본문) · easylaw(판시사항 전문) 를 고객 경로에서 import.
사유: 법률 자문 무면허 리스크 + v6.4 마케팅 지침.
`public-law-search-service.ts` 상단에 금지 조항 7개 명시. **확장 요청은 admin 경로로.**

---

## 7. 명령 모음

```bash
cd /c/Users/sangj/Documents/Codex/Admin-system
npx tsc --noEmit                                             # 커밋 전 필수
git add -A && git commit -m "..." && git push origin main    # → 자동배포

# 프로덕션 API (한글은 charset + --data-binary 필수)
AUTH='sangjin0302:arabica0302?!'
API="https://ethosattorney.com/api/admin/law-research"
printf '{"action":"searchLaw","params":{"keyword":"출입국관리법","limit":2}}' > /tmp/q.json
curl -sS -u "$AUTH" -X POST "$API" \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "Origin: https://ethosattorney.com" --data-binary @/tmp/q.json

# 진단 — env·프록시·서비스 레이어를 한 번에 (원인 특정용, 이게 다 잡아냄)
-d '{"action":"diagnose","params":{}}'
-d '{"action":"runLawHealthCheck","params":{}}'
-d '{"action":"checkRegistryLock","params":{}}'

# Lightsail
ssh -i "C:/Users/sangj/Downloads/arabica0302.pem" ubuntu@3.36.175.81
# /home/ubuntu/law_proxy_server.py (systemd: lawbot-proxy)
# allowlist: {"lawSearch.do", "lawService.do"} 만 허용
```

### registry 수정 절차 (반드시)
```
1) 프록시 실호출
   /drf/lawSearch.do?OC=sangjin_api&target=<key>&type=JSON&query=<질의>&display=1
2) 응답 최상위 키 = wrappers / 그 안 배열·객체 키 = itemKeys
3) law-registry-lock.ts 의 LOCKED_SPECS + LOCKED_AT 갱신
4) 헬스체크 → 실패 0 확인 (/admin/law-research 상단 "지금 점검")
```
추측으로 바꾸면 **조용히 죽고 아무도 모름.** 이 세션에서만 5건이 그렇게 숨어 있었음.

---

## 8. korean-law-mcp 참고

`github.com/chrisryugj/korean-law-mcp` (2.2k stars, MIT). 이 세션에서 **유령 target 실명을 이걸로 확인**했음 (상세링크의 `target=` 값).

- **기본 검색은 100% 겹침** (같은 법제처 API, MST 동일)
- 우리에게 없는 것: `cite_check`(판례 생사) · `applicable_law`(행위시법) · `impact_map` · `ordinance_radar` · 시점 diff
- `verify_citations`는 **접근법만 참고해 재구현 완료** (그 패키지는 law.go.kr 직접 호출 → Vercel IP 화이트리스트에 막힘 + hwp5/pdf 파서로 번들 비대)
- **병행 권장**: Claude Desktop에 붙여 깊은 리서치용. admin 웹은 문의/사건 연동. 형태가 달라 대체 불가

---

## 9. 이 세션 커밋 (최신순)

```
chore: 죽은 외부 연동 제거 (Phase 1+2) — lawbot UI · market-analyze
feat: registry 잠금 — 실측 기준선 + 회귀 감지
feat: 부처별 유권해석 8 → 38 확장 + mof/mogef 이름 오류 정정
fix: 유령 target 3개 추가 제거
docs: 미지원 6개 target 원인 정정
fix: lsRlt wrapper fallback — 헬스체크가 첫날 잡은 버그
fix: 에러 투명화 + 헬스체크 + 유령 target 정리
fix: env를 모듈 상수 대신 런타임에 읽기
feat: 법령 인용 검증 — AI 조문 환각 차단
fix: searchLifeLaw 6종 카테고리 파싱 + 블로그 AI 상시비용 차단
fix: UI 필드명 불일치 + 51 target 전부 UI 노출
feat: DRF 51 target · easylaw 20함수 · 고객경로 본문차단
feat: 생활법령(easylaw) admin 연동
feat: 법제처 API 코파일럿 통합 (Lightsail 프록시)
security: admin RBAC 백도어 3개 차단
perf: API 비용 절감 (AI캐싱 · Cron 41→8 · 라우트감사)
```

---

## 10. 작업 원칙 (이 세션에서 비싸게 배운 것)

1. **추측 금지, 실호출로 확인.** 이 세션 버그 11개 중 대부분이 추측 때문.
2. **`catch { return [] }` 금지.** 실패를 "결과 없음"으로 뭉개면 원인이 영영 안 보임.
3. **실패는 캐시하지 말 것.** 일시 장애가 24h 박힘.
4. **env는 호출 시점에 읽기.** 모듈 상수 + Vercel 빌드 캐시 = 빈 값 고착.
5. **삭제 전 grep으로 blast radius 확인.**
6. **사용자가 준 실물(스크린샷·에러 메시지)이 항상 옳았음.** 추측으로 세 번 잘못 단정했고 세 번 다 사용자 정보가 정답이었음.
