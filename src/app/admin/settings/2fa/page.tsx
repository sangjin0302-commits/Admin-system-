import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";

import { TotpSetup } from "./totp-setup";

export const dynamic = "force-dynamic";

export default function TwoFactorPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Security"
        title="2단계 인증 (TOTP)"
        description="관리자 계정에 시간 기반 OTP(2FA)를 설정합니다. RFC 6238 / 30초 윈도우."
      />
      <Card className="p-6 space-y-2">
        <p className="text-sm text-text-muted">
          시크릿은 SiteSetting 테이블에 <code>admin.2fa.&lt;email&gt;</code> 키로 저장됩니다.
          인증 앱에 등록할 때는 otpauth URL을 QR 코드로 변환하거나 시크릿을 직접 입력하세요.
        </p>
      </Card>
      <TotpSetup />
    </div>
  );
}
