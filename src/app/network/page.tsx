import { NetworkApplyClient } from "./client";

export const dynamic = "force-dynamic";

export default function NetworkLandingPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="ui-kicker">Collaboration Network</p>
      <h1 className="mt-2 text-3xl font-bold">동료 행정사와 협업하세요</h1>
      <p className="mt-3 text-sm text-text-muted">
        전문 분야가 겹치지 않는 사건은 서로에게 나누고, 지역·전문성 차이로 진행이 어려운 사건은
        신뢰할 수 있는 파트너에게 재배정할 수 있습니다. 수수료 정산까지 체계적으로 관리됩니다.
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        <li>· 검증된 행정사 네트워크</li>
        <li>· 사건 공유 및 재배정 자동 기록</li>
        <li>· 수수료 분배 자동 계산</li>
      </ul>
      <div className="mt-8">
        <NetworkApplyClient />
      </div>
    </main>
  );
}
