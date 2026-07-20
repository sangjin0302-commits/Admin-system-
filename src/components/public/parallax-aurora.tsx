/**
 * 히어로 배경 레이어.
 *
 * 예전에는 framer-motion 으로 스크롤 패럴랙스를 걸었다. 흐릿한 오로라 광원이
 * 스크롤에 따라 -60px 움직이고 페이드되는 방식이었다.
 *
 * A방향(여백·타이포)으로 정리하면서 광원 자체를 걷어냈고, 이제 이 레이어는
 * 종이 바탕의 아주 옅은 온도차만 담당한다(.ethos-aurora). 보이지도 않는
 * 그라디언트에 패럴랙스를 거는 것은 의미가 없고, 홈이 열릴 때마다 스크롤
 * 리스너와 애니메이션 프레임 비용만 발생한다.
 *
 * 그래서 클라이언트 컴포넌트를 서버 컴포넌트로 되돌렸다. 호출부는 그대로 둔다.
 */
export function ParallaxAurora({ className }: { className?: string }) {
  return <div className={className} aria-hidden />;
}
