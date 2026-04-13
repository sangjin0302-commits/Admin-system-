# DESIGN GUIDE

## 1. Tone & Manner

이 프로젝트의 UI는 행정사/전문사무소 업무 환경을 기준으로 설계한다.

- 핵심 인상: professional, trustworthy, calm, structured, readable
- 우선순위: 장식성보다 명확성, 화려함보다 안정감, 감성 연출보다 업무 효율
- 피해야 할 것: 과한 그라데이션, 과한 애니메이션, 과도한 공백, 불필요한 위젯

## 2. Color Palette

Light mode only.

### Semantic colors

- `canvas`: 전체 앱 배경
- `surface`: 기본 카드/패널 배경
- `surface-muted`: 보조 배경, 필터 영역, 표 헤더
- `surface-raised`: 가장 강조되는 흰색 영역
- `line`: 기본 경계선
- `line-strong`: 강한 구분선
- `text-strong`: 기본 텍스트
- `text`: 본문 텍스트
- `text-muted`: 보조 텍스트
- `primary`: 주 액션, 링크, 핵심 강조
- `primary-soft`: 주 색상의 연한 배경
- `success`: 수임/완료 등 긍정 상태
- `warning`: 주의/대기 상태
- `danger`: 긴급/오류 상태

### Actual values

- `--color-canvas: 244 246 248`
- `--color-surface: 255 255 255`
- `--color-surface-muted: 247 249 251`
- `--color-surface-raised: 255 255 255`
- `--color-line: 218 224 230`
- `--color-line-strong: 197 206 214`
- `--color-text-strong: 22 33 43`
- `--color-text: 58 71 82`
- `--color-text-muted: 103 118 130`
- `--color-primary: 24 72 109`
- `--color-primary-soft: 231 240 247`
- `--color-success: 40 112 76`
- `--color-warning: 161 104 36`
- `--color-danger: 166 63 63`

## 3. Typography Scale

서체는 한국어/영문 혼합 가독성을 우선한다.

- Base stack: `"Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif`
- `text-xs`: 보조 라벨, 메타 정보
- `text-sm`: 기본 UI 텍스트, 테이블, 입력 요소
- `text-base`: 본문 설명
- `text-lg`: 소제목
- `text-xl`: 카드/영역 제목
- `text-2xl`: 페이지 제목
- `text-3xl`: 중요 헤더

규칙:

- 본문 기본 line-height는 1.6 전후
- 페이지 제목은 굵고 짧게
- 메타 라벨은 uppercase 남용 금지, 관리자 화면에서는 한국어 우선

## 4. Spacing Scale

Tailwind 기본 spacing scale을 사용하되, 아래 간격을 우선 규칙으로 삼는다.

- `2`: 미세 간격
- `3`: badge / compact row
- `4`: 기본 내부 여백
- `5`: 카드 내부 여백
- `6`: 주요 섹션 여백
- `8`: 화면 내 블록 간격

규칙:

- 목록형 정보는 세로 밀도를 유지
- 카드가 커지더라도 불필요하게 세로를 소비하지 않음

## 5. Radius

- `sm`: 10px
- `md`: 14px
- `lg`: 18px
- `xl`: 22px

규칙:

- 입력 요소는 `md`
- 카드/패널은 `lg`
- 강조 패널/상태 박스는 `xl`

## 6. Shadow Rules

- 기본 카드: 매우 옅은 그림자
- Hover 강조: 그림자보다 border 강조 우선
- 중요도 표현은 shadow보다 badge, tone, border로 처리

실제 사용:

- `shadow-panel`: 기본 카드
- `shadow-floating`: 드롭다운/상단 고정 필터 등

## 7. Button Variants

- `primary`: 주요 저장/확인/접수 액션
- `secondary`: 보조 액션
- `subtle`: 배경 있는 중립 버튼
- `ghost`: 텍스트성 액션
- `danger`: 파괴적 액션

규칙:

- 같은 화면에서 primary는 1개가 기본
- 관리자 화면은 subtle/secondary 비중을 높이고 primary는 저장 계열에 집중

## 8. Form Controls

- Input / Textarea / Select는 동일한 테두리/포커스 규칙 공유
- 기본 배경은 `surface-raised`
- 포커스는 `primary` 계열 outline
- placeholder는 `text-muted`
- textarea는 읽기 쉬운 줄 간격 유지

## 9. Card Style

- 카드 배경은 흰색
- 테두리는 얇고 명확하게
- 제목, 메타, 본문이 수직 리듬을 갖도록 구성
- 관리자 정보 카드는 “시선 분산”보다 “빠른 스캔”을 우선

## 10. Badge Style

- 상태, 긴급도, 언어, 문의 유형에 사용
- 채도는 낮추고 대비는 유지
- 빨간색은 긴급/오류에만 제한적으로 사용

## 11. Table Style

- 헤더는 muted surface
- row hover는 아주 연한 배경 변화
- 수직선보다 가로 구분 위주
- 모바일에서는 카드뷰로 자연스럽게 전환

## 12. Empty / Loading / Error State

- Empty: 현재 상태를 설명하고 다음 행동을 제안
- Loading: skeleton 또는 muted block 사용
- Error: 경고색 배경 + 해결 행동 제시

문구 원칙:

- 짧고 단정하게
- 문제를 과장하지 않음
- 관리자 화면은 “왜 비어 있는지”를 함께 설명

## 13. Tailwind / CSS Variable 운영 원칙

- 색상은 CSS variables + Tailwind semantic color alias로 관리
- 컴포넌트 스타일은 `components/ui`에서 재사용
- 상태 색상, 버튼 variants는 TS 상수로 관리
- 새 화면은 raw color class 대신 semantic class 사용

## 14. Component Mapping

- `components/ui/button.tsx`: 버튼 variant 규칙
- `components/ui/input.tsx`, `select.tsx`, `textarea.tsx`: 입력 계열
- `components/ui/card.tsx`: 카드/패널
- `components/ui/badge.tsx`: 상태 및 분류 배지
- `components/ui/table.tsx`: 관리자 목록 공통 테이블
- `components/ui/state-panel.tsx`: empty / loading / error

## 15. Responsive Principle

- 모바일: 카드뷰 우선
- 태블릿 이상: 카드 + 표 혼합 가능
- 데스크톱: 정보 밀도 상승 허용, 단 줄 간격과 여백은 유지

## 16. Future Extensions

- PostgreSQL 전환 시에도 semantic token 구조 유지
- 다크모드는 추후 별도 토큰 세트로 확장
- 이메일/PDF/알림톡 템플릿도 같은 tone & manner를 공유
