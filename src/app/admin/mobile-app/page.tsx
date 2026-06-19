import { Card } from "@/components/ui/card";
import { getActiveDevices } from "@/lib/services/mobile-bridge-service";

export const dynamic = "force-dynamic";

export default function AdminMobileAppPage() {
  const devices = getActiveDevices();

  return (
    <div className="space-y-6">
      <div>
        <div className="ui-kicker">Mobile</div>
        <h1 className="ui-page-title">Mobile App Bridge</h1>
      </div>

      <Card>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Registered Devices</h2>
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No devices registered yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2">Device ID</th>
                  <th>User</th>
                  <th>Platform</th>
                  <th>Push Token</th>
                  <th>Last Active</th>
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
          <h2 className="text-lg font-semibold">API Documentation</h2>
          <div className="space-y-4 text-sm">
            <div>
              <div className="font-mono font-semibold">
                POST /api/mobile/register
              </div>
              <p className="text-muted-foreground">
                Register a device. Body: {`{ deviceId, userId, pushToken?, platform }`}
              </p>
            </div>
            <div>
              <div className="font-mono font-semibold">
                GET /api/mobile/inquiries?page=1
              </div>
              <p className="text-muted-foreground">
                Returns paginated inquiries (20 per page) with limited fields.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
