
import { ZodError, z } from "zod";

import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  getPublicIntakeControlCapabilities,
  getPublicIntakeControlSnapshot,
  listPublicIntakeControlHistory,
  updatePublicIntakeControl
} from "@/lib/services/public-intake-control-service-safe-v3";

const updateIntakeControlSchema = z.object({
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().max(300).optional(),
  retryAfterSec: z.number().int().min(30).max(86_400).optional(),
  updatedBy: z.string().max(80).optional(),
  changeReason: z.string().max(300).optional()
});

const KO_GET_CONTROL_FAILED =
  "\uC811\uC218 \uC6B4\uC601 \uC0C1\uD0DC\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
const KO_READ_ONLY_REASON_REQUIRED =
  "\uD604\uC7AC \uBAA8\uB4DC \uC124\uC815\uC740 \uC800\uC7A5\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.";
const KO_INVALID_JSON_BODY =
  "\uC694\uCCAD \uBCF8\uBB38\uC740 \uC62C\uBC14\uB978 JSON \uD615\uC2DD\uC774 \uC544\uB2D9\uB2C8\uB2E4.";
const KO_REASON_REQUIRED =
  "\uC6B4\uC601 \uBCC0\uACBD \uC0AC\uC720\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.";
const KO_INVALID_INPUT =
  "\uC785\uB825 \uAC12\uC744 \uB2E4\uC2DC \uD655\uC778\uD574 \uC8FC\uC138\uC694.";
const KO_UPDATE_FAILED =
  "\uC811\uC218 \uC6B4\uC601 \uC0C1\uD0DC\uB97C \uC800\uC7A5\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";

function parseHistoryLimit(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("limit");
  const parsed = raw ? Number.parseInt(raw, 10) : 15;
  if (!Number.isFinite(parsed)) return 15;
  return Math.min(50, Math.max(1, parsed));
}

export async function GET(request: Request) {
  const api = createAdminRequestContext("admin.system.intake_control.get");

  try {
    const limit = parseHistoryLimit(request);
    const [snapshot, history, capabilities] = await Promise.all([
      getPublicIntakeControlSnapshot(),
      listPublicIntakeControlHistory(limit),
      Promise.resolve(getPublicIntakeControlCapabilities())
    ]);
    return api.ok({ ok: true, snapshot, history, capabilities });
  } catch (error) {
    api.logError(error);
    return api.error(500, KO_GET_CONTROL_FAILED, {
      code: "GET_INTAKE_CONTROL_FAILED"
    });
  }
}

export async function POST(request: Request) {
  const api = createAdminRequestContext("admin.system.intake_control.post");

  try {
    const capabilities = getPublicIntakeControlCapabilities();
    if (!capabilities.writable) {
      return api.error(503, capabilities.reason ?? KO_READ_ONLY_REASON_REQUIRED, {
        code: "INTAKE_CONTROL_READ_ONLY"
      });
    }

    const bodyResult = await safeReadJsonBody(request);
    if (!bodyResult.ok) {
      return api.error(400, KO_INVALID_JSON_BODY, {
        code: "INVALID_JSON_BODY"
      });
    }

    const parsed = updateIntakeControlSchema.parse(bodyResult.body);
    const current = await getPublicIntakeControlSnapshot();
    const messageChanged =
      typeof parsed.maintenanceMessage === "string" &&
      parsed.maintenanceMessage.trim() !== current.maintenanceMessage;
    const retryChanged =
      typeof parsed.retryAfterSec === "number" && parsed.retryAfterSec !== current.retryAfterSec;
    const modeChanged = parsed.maintenanceMode !== current.maintenanceMode;
    const hasMeaningfulChange = messageChanged || retryChanged || modeChanged;

    if (hasMeaningfulChange && !parsed.changeReason?.trim()) {
      return api.error(400, KO_REASON_REQUIRED, {
        code: "INTAKE_CONTROL_REASON_REQUIRED"
      });
    }

    const snapshot = await updatePublicIntakeControl(parsed);
    const history = await listPublicIntakeControlHistory(20);
    return api.ok({ ok: true, snapshot, history, capabilities });
  } catch (error) {
    if (error instanceof ZodError) {
      return api.error(400, firstZodMessage(error, KO_INVALID_INPUT), {
        code: "INVALID_INTAKE_CONTROL_INPUT"
      });
    }

    api.logError(error);
    return api.error(500, KO_UPDATE_FAILED, {
      code: "UPDATE_INTAKE_CONTROL_FAILED"
    });
  }
}
