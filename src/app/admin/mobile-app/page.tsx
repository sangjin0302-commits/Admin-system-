import { Card } from "@/components/ui/card";
import { getActiveDevices } from "@/lib/services/mobile-bridge-service";

export const dynamic = "force-dynamic";

export default function AdminMobileAppPage() {
  const devices = getActiveDevices();

  return (
    <div className="space-y-6">
      <div>
        <div className="ui-kicker">모바일</div>
        <h1 className="ui-page-title">모바일 앱 연동</h1>
      </div>

      <Card>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">등록된 기기</h2>
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              등록된 기기가 없습니다.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2">기기 ID</th>
                  <th>사용자</th>
                  <th>플랫폼</th>
                  <th>푸시 토큰</th>
                  <th>최근 활동</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.deviceId} className="border-t">
                    <td className="py-2 font-mono text-xs">{d.deviceId}</td>
                    <td>{d.userId}</td>
                    <td>{d.platform}</td>
                    <td className="font-mono text-xs">
                      {d.pushToken ? `${d.pushToken.slice(0, 12)}...` : "—"}
                    </td>
                    <td>{d.lastActiveAt.toISOString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Card>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">API 문서</h2>
          <div className="space-y-4 text-sm">
            <div>
              <div className="font-mono font-semibold">
                POST /api/mobile/register
              </div>
              <p className="text-muted-foreground">
                기기를 등록합니다. 요청 본문: {`{ deviceId, userId, pushToken?, platform }`}
              </p>
            </div>
            <div>
              <div className="font-mono font-semibold">
                GET /api/mobile/inquiries?page=1
              </div>
              <p className="text-muted-foreground">
                문의 목록을 페이지 단위(페이지당 20건)로 반환하며, 일부 필드만 포함합니다.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
