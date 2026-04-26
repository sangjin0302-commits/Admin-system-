import {
  LawbotBridgeWorkflowLockedError,
  runLawbotBridgeCaseWorkflow,
  type BridgeWorkflowPersistencePort,
  type LawbotBridgeWorkflowClient
} from "./lawbot-bridge-case-workflow-service";
import { normalizeBridgeTextDeep } from "./lawbot-bridge-text-normalizer";

export type RunLawbotWorkflowDependencies = {
  client: LawbotBridgeWorkflowClient;
  persistence: BridgeWorkflowPersistencePort;
};

type RunLawbotWorkflowRequestPayload = {
  documentDraftKind?: string;
  customerMessageKind?: string;
  customerMessageTone?: string;
};

type LawbotBridgeErrorLike = {
  name?: string;
  message?: string;
  status?: number;
};

function parseOptionalStringField(
  value: unknown,
  fieldName: string
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} must not be empty.`);
  }
  return trimmed;
}

function parseRunLawbotWorkflowRequestPayload(
  input: unknown
): RunLawbotWorkflowRequestPayload {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    if (input === undefined || input === null) {
      return {};
    }
    throw new Error("Request body must be an object.");
  }

  const record = input as Record<string, unknown>;
  return {
    documentDraftKind: parseOptionalStringField(record.documentDraftKind, "documentDraftKind"),
    customerMessageKind: parseOptionalStringField(record.customerMessageKind, "customerMessageKind"),
    customerMessageTone: parseOptionalStringField(record.customerMessageTone, "customerMessageTone")
  };
}

export async function createRunLawbotWorkflowDependencies(): Promise<RunLawbotWorkflowDependencies> {
  const [{ createLawbotBridgeHttpClientFromEnv }, { createLawbotBridgeWorkflowPrismaPersistence }] =
    await Promise.all([
      import("./lawbot-bridge-http-client"),
      import("./lawbot-bridge-workflow-prisma-persistence")
    ]);

  return {
    client: createLawbotBridgeHttpClientFromEnv(),
    persistence: createLawbotBridgeWorkflowPrismaPersistence()
  };
}

export async function handleRunLawbotWorkflowRequest(
  request: Request,
  inquiryId: string,
  dependencies?: RunLawbotWorkflowDependencies
) {
  try {
    const rawBody = request.method === "POST" ? await request.text() : "";
    const parsedBody = rawBody.trim().length > 0 ? JSON.parse(rawBody) : {};
    const payload = parseRunLawbotWorkflowRequestPayload(parsedBody);
    const resolvedDependencies = dependencies ?? (await createRunLawbotWorkflowDependencies());

    const result = await runLawbotBridgeCaseWorkflow(resolvedDependencies, {
      inquiryId,
      documentDraftKind: payload.documentDraftKind,
      customerMessageKind: payload.customerMessageKind,
      customerMessageTone: payload.customerMessageTone
    });

    return Response.json({ result: normalizeBridgeTextDeep(result) }, { status: 200 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    if (error instanceof Error && error.message.startsWith("Inquiry not found:")) {
      return Response.json({ error: "Inquiry not found." }, { status: 404 });
    }

    if (error instanceof LawbotBridgeWorkflowLockedError) {
      return Response.json(
        {
          error:
            "Workflow is already locked in APPROVAL_PENDING/APPROVED. Use review flow instead of rerun.",
          reason: "lawbot_bridge_workflow_locked"
        },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message.includes("must")) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    const bridgeError = error as LawbotBridgeErrorLike;
    if (bridgeError?.name === "LawbotBridgeTransportError") {
      return Response.json(
        {
          error: "Lawbot bridge request timed out or network transport failed.",
          reason: "lawbot_bridge_transport_error"
        },
        { status: 504 }
      );
    }

    if (bridgeError?.name === "LawbotBridgeServiceError") {
      return Response.json(
        {
          error: "Lawbot bridge service is unavailable or returned a server error.",
          reason: "lawbot_bridge_service_error",
          upstreamStatus: bridgeError.status ?? null
        },
        { status: 503 }
      );
    }

    if (bridgeError?.name === "LawbotBridgeAuthError") {
      return Response.json(
        {
          error: "Lawbot bridge authentication failed.",
          reason: "lawbot_bridge_auth_error",
          upstreamStatus: bridgeError.status ?? null
        },
        { status: 502 }
      );
    }

    if (bridgeError?.name === "LawbotBridgeRequestError") {
      return Response.json(
        {
          error: "Lawbot bridge rejected the request payload.",
          reason: "lawbot_bridge_request_error",
          upstreamStatus: bridgeError.status ?? null
        },
        { status: 502 }
      );
    }

    return Response.json(
      {
        error: error instanceof Error
          ? error.message
          : "Failed to run Lawbot bridge workflow."
      },
      { status: 500 }
    );
  }
}
