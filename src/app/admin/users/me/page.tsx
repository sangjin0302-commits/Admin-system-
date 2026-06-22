import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProfileForm } from "./profile-form";
import { TwoFactorEnroll } from "./two-factor-enroll";

export const dynamic = "force-dynamic";

export default function MyProfilePage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="My Account"
        title="내 프로필 + 2단계 인증"
        description="이름·비밀번호 변경, TOTP 2FA 설정."
      />
      <Card className="p-4 md:p-6">
        <ProfileForm />
      </Card>
      <Card className="p-4 md:p-6">
        <TwoFactorEnroll />
      </Card>
    </div>
  );
}
