import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

import { KakaoTestButton } from "./kakao-test-button";

export const dynamic = "force-dynamic";

function getKakaoStatus() {
  const hasApiKey = Boolean(process.env.KAKAO_REST_API_KEY?.trim());
  const hasSenderKey = Boolean(process.env.KAKAO_SENDER_KEY?.trim());
  return { hasApiKey, hasSenderKey, connected: hasApiKey && hasSenderKey };
}

export default function KakaoIntegrationPage() {
  const status = getKakaoStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        kicker="Integration"
        title="카카오톡 채널 연동"
        description="카카오 알림톡을 통해 고객에게 문의 접수 확인, 사건 진행 상태 등을 자동 알림합니다."
      />

      {/* Status */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">연동 상태</h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                status.hasApiKey ? "bg-emerald-500" : "bg-gray-300"
              }`}
            />
            <span className="text-sm text-text-muted">
              KAKAO_REST_API_KEY —{" "}
              {status.hasApiKey ? "설정됨" : "미설정"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                status.hasSenderKey ? "bg-emerald-500" : "bg-gray-300"
              }`}
            />
            <span className="text-sm text-text-muted">
              KAKAO_SENDER_KEY —{" "}
              {status.hasSenderKey ? "설정됨" : "미설정"}
            </span>
          </div>
        </div>

        {status.connected && (
          <div className="mt-6">
            <KakaoTestButton />
          </div>
        )}
      </Card>

      {/* Setup instructions */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">설정 방법</h3>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-text-muted">
          <li>
            <a
              href="https://business.kakao.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              카카오 비즈니스
            </a>
            에서 비즈니스 채널을 등록합니다.
          </li>
          <li>알림톡 발신 프로필을 생성하고 SENDER_KEY를 발급받습니다.</li>
          <li>
            <a
              href="https://developers.kakao.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Kakao Developers
            </a>
            에서 REST API 키를 확인합니다.
          </li>
          <li>
            환경 변수 <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">KAKAO_REST_API_KEY</code>와{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">KAKAO_SENDER_KEY</code>를 설정합니다.
          </li>
          <li>알림톡 템플릿을 등록하고 검수를 완료합니다.</li>
        </ol>
      </Card>
    </div>
  );
}
