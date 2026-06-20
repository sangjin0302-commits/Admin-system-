import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { COMMAND_MAP } from "@/lib/services/voice-command-service";
import { VoiceAssistant } from "@/components/admin/voice-assistant";

export const dynamic = "force-dynamic";

export default function VoiceAssistantPage() {
  const commands = Object.entries(COMMAND_MAP);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="AI Tools"
        title="음성 비서"
        description="Web Speech API 기반 한국어 음성 명령 시스템. 우측 하단의 위젯을 꾹 눌러 명령을 말하세요."
      />

      <Card className="p-6">
        <h3 className="mb-3 text-sm font-semibold text-text-strong">설정 안내</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-text-muted">
          <li>마이크 권한을 허용해야 합니다.</li>
          <li>Chrome / Edge 등 Web Speech API 지원 브라우저가 필요합니다.</li>
          <li>위젯의 버튼을 누르고 있는 동안 음성을 인식합니다.</li>
          <li>인식 결과는 한국어 TTS로 피드백을 제공합니다.</li>
        </ul>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-text-strong">
          사용 가능한 명령 ({commands.length})
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {commands.map(([phrase, info]) => (
            <div
              key={phrase}
              className="rounded border border-line bg-surface-muted p-3"
            >
              <p className="font-medium text-text-strong">&quot;{phrase}&quot;</p>
              <p className="mt-1 text-xs text-text-muted">{info.description}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">
                {info.action.type}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <VoiceAssistant />
    </div>
  );
}
