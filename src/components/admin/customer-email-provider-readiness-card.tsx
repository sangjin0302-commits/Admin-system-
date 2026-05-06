import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { CustomerEmailProviderReadiness } from "@/lib/services/customer-email-provider-config";
import { buildCustomerEmailProviderReadinessViewModel } from "@/lib/services/customer-email-provider-readiness-ui-model";

function StatusField({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string;
  tone?: "neutral" | "safe" | "blocked";
}) {
  const toneClass =
    tone === "safe"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "blocked"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-line bg-surface text-text";

  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <Badge className={`mt-2 ${toneClass}`}>{value}</Badge>
    </div>
  );
}

export function CustomerEmailProviderReadinessCard({
  readiness
}: {
  readiness: CustomerEmailProviderReadiness;
}) {
  const viewModel = buildCustomerEmailProviderReadinessViewModel(readiness);

  return (
    <Card muted className="mt-5 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="ui-kicker">이메일 발송 설정 상태</p>
          <div className="mt-2 space-y-1 text-sm text-text-muted">
            <p>현재 실제 이메일 발송은 비활성화되어 있습니다.</p>
            <p>이 화면에서는 dry-run 및 준비 기록만 가능합니다.</p>
            <p>
              실제 발송은 도메인/발신자/provider 설정과 별도 승인 후에만 활성화됩니다.
            </p>
          </div>
        </div>
        <Badge className="border-amber-200 bg-amber-50 text-amber-800">
          real email disabled
        </Badge>
      </div>

      <Card muted className="mt-5 border-amber-200 bg-amber-50/70 p-4">
        <div className="space-y-1 text-sm text-amber-900">
          <p className="font-semibold">실제 이메일은 발송되지 않습니다.</p>
          <p>SMS/알림톡 발송도 제공되지 않습니다.</p>
          <p>현재는 고객 안내문 복사, 미리보기, 수동 전달 기록, 이메일 dry-run 기록만 가능합니다.</p>
        </div>
      </Card>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <StatusField label="Provider" value={viewModel.provider} />
        <StatusField label="Provider enabled" value={viewModel.providerEnabledLabel} />
        <StatusField label="Real send enabled" value={viewModel.realSendEnabledLabel} />
        <StatusField label="Dry-run only" value={viewModel.dryRunOnlyLabel} tone="safe" />
        <StatusField
          label="실제 provider 사용 가능"
          value={viewModel.canUseRealProviderLabel}
          tone="blocked"
        />
        <StatusField
          label="실제 이메일 발송 가능"
          value={viewModel.canSendRealEmailLabel}
          tone="blocked"
        />
        <StatusField
          label="externalActionAllowed"
          value={viewModel.externalActionAllowedLabel}
          tone="blocked"
        />
        <StatusField
          label="providerImplementationStatus"
          value={viewModel.providerImplementationStatus}
        />
        <StatusField label="hasApiKey" value={viewModel.hasApiKeyLabel} />
        <StatusField label="hasFromAddress" value={viewModel.hasFromAddressLabel} />
        <StatusField label="hasReplyTo" value={viewModel.hasReplyToLabel} />
        <StatusField label="hasAllowedDomain" value={viewModel.hasAllowedDomainLabel} />
        <StatusField label="fromDomainAllowed" value={viewModel.fromDomainAllowedLabel} />
      </div>

      <Card muted className="mt-5 p-4">
        <p className="ui-kicker">차단 사유</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text">
          {viewModel.blockedReasonLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {viewModel.rawBlockedReasonCodes.map((code) => (
            <Badge key={code} className="border-line bg-surface text-text-muted">
              {code}
            </Badge>
          ))}
        </div>
      </Card>
    </Card>
  );
}
