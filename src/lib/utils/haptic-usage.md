# Haptic Feedback 배선 가이드

`useHaptic()` 훅으로 모바일 진동 피드백을 트리거합니다. 프리셋: `success`, `error`, `tap`, `notification`.

## 프로바이더 마운트

루트 레이아웃 또는 공개 페이지 셸에서 한 번만 감싸세요.

```tsx
import { HapticProvider } from "@/components/public/haptic-provider";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

// 서버 컴포넌트에서 플래그 조회
const hapticEnabled = await isFeatureEnabled("haptic_feedback");

return (
  <HapticProvider defaultEnabled={hapticEnabled}>
    {children}
  </HapticProvider>
);
```

## 배선 지점 (보호 파일)

다음 파일들은 이 라운드에서 직접 편집할 수 없어 지금은 문서로만 남깁니다. 다음 라운드에서 배선하세요.

### sticky-cta.tsx

버튼 `onClick`에 추가:

```tsx
const haptic = useHaptic();
// ...
onClick={() => {
  haptic.trigger("tap");
  // 기존 로직
}}
```

### quick-consult-form.tsx (성공 시)

폼 제출 성공 콜백:

```tsx
const haptic = useHaptic();
// ...
if (result.ok) {
  haptic.trigger("success");
  // 기존 로직
}
```

### exit-intent.tsx (폼 제출 성공)

```tsx
haptic.trigger("success");
```

## 사용자 opt-out

`localStorage["ethos.haptic.enabled"] = "0"` 으로 방문자별 opt-out.
설정 UI(예: 접근성 패널)에서 `useHaptic().setEnabled(false)` 호출.

## 지원 상황

`navigator.vibrate`는 iOS Safari에서 미지원 — 훅은 no-op으로 안전하게 강등됩니다.
Android Chrome/Firefox는 지원.
