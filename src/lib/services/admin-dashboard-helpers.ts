import type { PublicIntakeControlSnapshot } from "@/lib/services/public-intake-control-service-safe-v3";
import type { HealthLevel } from "@/lib/services/system-health-service-safe-v3";
import type { InquiryStatus } from "@/types/inquiry";

export type DashboardPrioritySource = {
  status: string;
  urgencyLevel: string;
  dueDate?: Date | null;
  nextContactAt?: Date | null;
  responsePending?: boolean;
  hasPreparedDocuments?: boolean;
};

export function isWithinDays(date: Date | null | undefined, days: number) {
  if (!date) return false;
  const now = new Date();
  const distance = date.getTime() - now.getTime();
  return distance >= 0 && distance <= days * 24 * 60 * 60 * 1000;
}

export function getLawbotStatus() {
  const hasAnalyzeUrl = Boolean(process.env.LAWBOT_ANALYZE_URL?.trim());
  const hasAnalyzeToken = Boolean(process.env.LAWBOT_ANALYZE_TOKEN?.trim());

  if (hasAnalyzeUrl && hasAnalyzeToken) {
    return {
      label: "연동 준비 완료",
      toneClassName: "bg-success/10 text-success",
      description: "사건 상세에서 Lawbot 분석 호출과 결과 동기화까지 가능한 상태입니다."
    };
  }

  if (hasAnalyzeUrl) {
    return {
      label: "주소만 연결됨",
      toneClassName: "bg-warning/10 text-warning",
      description: "분석 주소는 설정되었지만 토큰이 없어 운영 기준에서는 추가 설정이 필요합니다."
    };
  }

  return {
    label: "미연결",
    toneClassName: "bg-danger/10 text-danger",
    description: "UI 구조는 준비되어 있지만 실제 분석 호출은 아직 비활성 상태입니다."
  };
}

function envEnabled(value: string | undefined, fallback: boolean) {
  const raw = value?.trim().toLowerCase();
  if (!raw) return fallback;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

export function getPublicIntakeStatus(control: PublicIntakeControlSnapshot) {
  const sameOriginEnabled = envEnabled(process.env.PUBLIC_INTAKE_REQUIRE_SAME_ORIGIN, true);
  const honeypotEnabled = envEnabled(process.env.PUBLIC_INTAKE_ENABLE_HONEYPOT, true);

  if (control.maintenanceMode) {
    return {
      label: "점검 중",
      toneClassName: "bg-warning/10 text-warning",
      description: `현재 공개 접수가 점검 모드입니다. (${control.source.toUpperCase()} 설정)`
    };
  }

  if (!sameOriginEnabled || !honeypotEnabled) {
    return {
      label: "보안 조치 필요",
      toneClassName: "bg-danger/10 text-danger",
      description: "공개 접수 보안 옵션이 완전하지 않아 운영 보강이 필요합니다."
    };
  }

  return {
    label: "운영 중",
    toneClassName: "bg-success/10 text-success",
    description: `공개 접수가 정상 운영 중입니다. (${control.source.toUpperCase()} 기준)`
  };
}

export function getHealthTone(level: HealthLevel | null) {
  if (level === "ok") {
    return {
      label: "안정",
      toneClassName: "bg-success/10 text-success"
    };
  }

  if (level === "warn") {
    return {
      label: "주의",
      toneClassName: "bg-warning/10 text-warning"
    };
  }

  return {
    label: level === "critical" ? "위험" : "확인 필요",
    toneClassName: "bg-danger/10 text-danger"
  };
}

export function getStatusTone(status: InquiryStatus) {
  if (["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(status)) return "quote";
  if (["CONSULTATION_REQUIRED", "WAITING_CONSULTATION"].includes(status)) return "consult";
  if (status === "ON_HOLD") return "risk";
  if (status === "WON") return "won";
  return "default";
}

export function getPriorityScore(item: DashboardPrioritySource) {
  let score = 0;
  if (item.urgencyLevel === "CRITICAL") score += 90;
  if (isWithinDays(item.dueDate, 1)) score += 40;
  if (item.responsePending) score += 32;
  if (!item.hasPreparedDocuments && item.status !== "WON") score += 24;
  if (["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)) score += 18;
  if (["CONSULTATION_REQUIRED", "WAITING_CONSULTATION"].includes(item.status)) score += 16;
  if (isWithinDays(item.nextContactAt, 1)) score += 14;
  return score;
}

export function getPriorityReason(item: DashboardPrioritySource) {
  if (item.urgencyLevel === "CRITICAL" || isWithinDays(item.dueDate, 1)) {
    return "긴급도 또는 일정 기준으로 즉시 확인이 필요합니다.";
  }
  if (item.responsePending || isWithinDays(item.nextContactAt, 1)) {
    return "고객 회신 또는 다음 연락 시점이 가까워 커뮤니케이션 우선 처리가 필요합니다.";
  }
  if (!item.hasPreparedDocuments && item.status !== "WON") {
    return "자료 미확보 상태라 진행 병목을 막기 위해 먼저 서류 요청이 필요합니다.";
  }
  if (["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)) {
    return "견적 후속 단계를 정리해 전환 흐름을 이어야 합니다.";
  }
  return "운영 안정성을 위해 우선 확인하면 좋은 항목입니다.";
}

export function getOperationalHealthToneClass(score: number) {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-warning";
  return "bg-danger";
}
