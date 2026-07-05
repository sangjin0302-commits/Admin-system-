# DB 읽기 복제본 사용 안내

## 목적

주 DB 부하를 낮추기 위해 조회 쿼리를 읽기 복제본으로 라우팅.

## 옵트인 방법

기본은 여전히 `import { prisma } from "@/lib/prisma/client"` (주 DB).
읽기 복제본으로 옮기고 싶은 곳만 아래처럼 변경:

```ts
import { readPrisma, readWithFallback } from "@/lib/services/db-read-replica-service";

// 방법 A: 단순 라우팅 (미설정 시 자동 fallback)
const cases = await readPrisma().case.findMany({ where: { status: "ACTIVE" } });

// 방법 B: 실패 시 자동 재시도
const cases = await readWithFallback((db) => db.case.findMany({ where: { status: "ACTIVE" } }));
```

## 어떤 쿼리를 옮길까?

**옮기기 좋음 (heavy read)**
- 대시보드 집계 (`count`, `aggregate`, `groupBy`)
- 리스트 페이지 (`findMany` — inquiry list, case list, blog archive)
- 분석 페이지 (UTM 대시보드, AI metrics)
- 공개 페이지 데이터 (blog, case-stories)

**옮기지 않음 (일관성 필요)**
- 쓰기 직후 읽기 (트랜잭션, 편집 후 재조회) — 복제 지연 위험
- 로그인·세션 검증
- 결제·계약 등 금전 관련
- 감사 로그

## 환경변수

```
DATABASE_URL=postgresql://...        # 주 (쓰기)
DATABASE_READ_REPLICA_URL=postgresql://...  # 선택 — 없으면 자동 fallback
```

## 통계

`GET /api/admin/db/replicas` → `{ primary, replica, stats: { readReplica, readPrimary, fallbacks, writesPrimary } }`

## 실패 시 동작

- `readPrisma()`: 복제본 없거나 클라이언트 생성 실패 시 주 DB 반환
- `readWithFallback()`: 쿼리 실행 실패 시 주 DB에서 재시도, `stats.fallbacks` 증가

## 기능 플래그

`read_replica_routing` (기본 false). 플래그가 꺼져 있어도 코드 상 `readPrisma()`는 여전히 작동 —
플래그는 관리 UI 노출·모니터링 목적. 실제 라우팅 여부는 `DATABASE_READ_REPLICA_URL` 유무로만 결정.
