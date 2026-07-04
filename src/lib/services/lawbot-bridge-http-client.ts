import type {
  LawbotBridgeCustomerMessageDraftRequest,
  LawbotBridgeDocumentDraftRequest,
  LawbotBridgeIntakeAnalyzeRequest,
  LawbotBridgeIntakeProfileRequest,
  LawbotBridgeWorkflowClient
} from "./lawbot-bridge-case-workflow-service";
import type {
  BridgeCustomerMessageDraftResponse,
  BridgeDocumentDraftResponse,
  BridgeIntakeAnalyzeResponse,
  BridgeIntakeProfileResponse
} from "./lawbot-bridge-workflow-mapping-service";
import { lawbotCache } from "./lawbot-cache";

type FetchLike = typeof fetch;

export type LawbotBridgeHttpClientConfig = {
  baseUrl: string;
  serviceKey: string;
  serviceCaller: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryBackoffMs?: number;
};

export class LawbotBridgeError extends Error {
  status?: number;
  responseBody?: string;

  constructor(message: string, options?: { status?: number; responseBody?: string }) {
    super(message);
    this.name = "LawbotBridgeError";
    this.status = options?.status;
    this.responseBody = options?.responseBody;
  }
}

export class LawbotBridgeAuthError extends LawbotBridgeError {
  constructor(message: string, options?: { status?: number; responseBody?: string }) {
    super(message, options);
    this.name = "LawbotBridgeAuthError";
  }
}

export class LawbotBridgeRequestError extends LawbotBridgeError {
  constructor(message: string, options?: { status?: number; responseBody?: string }) {
    super(message, options);
    this.name = "LawbotBridgeRequestError";
  }
}

export class LawbotBridgeServiceError extends LawbotBridgeError {
  constructor(message: string, options?: { status?: number; responseBody?: string }) {
    super(message, options);
    this.name = "LawbotBridgeServiceError";
  }
}

export class LawbotBridgeTransportError extends LawbotBridgeError {
  constructor(message: string, options?: { status?: number; responseBody?: string }) {
    super(message, options);
    this.name = "LawbotBridgeTransportError";
  }
}

type NormalizedConfig = {
  baseUrl: string;
  serviceKey: string;
  serviceCaller: string;
  timeoutMs: number;
  maxRetries: number;
  retryBackoffMs: number;
};

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function normalizeConfig(config: LawbotBridgeHttpClientConfig): NormalizedConfig {
  const normalized = {
    baseUrl: normalizeBaseUrl(config.baseUrl),
    serviceKey: config.serviceKey.trim(),
    serviceCaller: config.serviceCaller.trim(),
    timeoutMs: config.timeoutMs ?? 8000,
    maxRetries: config.maxRetries ?? 1,
    retryBackoffMs: config.retryBackoffMs ?? 250
  };

  if (!normalized.baseUrl) {
    throw new Error("LAWBOT_BRIDGE_BASE_URL is required.");
  }
  if (!normalized.serviceKey) {
    throw new Error("LAWBOT_SERVICE_KEY is required.");
  }
  if (!normalized.serviceCaller) {
    throw new Error("LAWBOT_SERVICE_CALLER is required.");
  }

  return normalized;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(status: number) {
  return [429, 500, 502, 503, 504].includes(status);
}

function mapStatusError(status: number, body: string) {
  const message = `Lawbot bridge request failed with status ${status}.`;

  if (status === 401 || status === 403) {
    return new LawbotBridgeAuthError(message, { status, responseBody: body });
  }
  if (status === 400 || status === 404 || status === 422) {
    return new LawbotBridgeRequestError(message, { status, responseBody: body });
  }
  return new LawbotBridgeServiceError(message, { status, responseBody: body });
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

async function readResponseBody(response: Response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

type JsonRecord = Record<string, unknown>;

type RequestOptions = {
  path: string;
  body: JsonRecord;
};

export class LawbotBridgeHttpClient implements LawbotBridgeWorkflowClient {
  private readonly config: NormalizedConfig;
  private readonly fetchImpl: FetchLike;

  constructor(config: LawbotBridgeHttpClientConfig, fetchImpl: FetchLike = fetch) {
    this.config = normalizeConfig(config);
    this.fetchImpl = fetchImpl;
  }

  async intakeAnalyze(
    request: LawbotBridgeIntakeAnalyzeRequest
  ): Promise<BridgeIntakeAnalyzeResponse> {
    const body: JsonRecord = {
      request_id: request.requestId,
      intake: {
        fact_input: request.factInput,
        attachments_present: false,
        channel: "admin-system"
      },
      options: {}
    };
    if (request.caseProfile) {
      body.case_ref = request.caseProfile;
    }

    return this.postJson<BridgeIntakeAnalyzeResponse>({
      path: "/bridge/intake/analyze",
      body
    });
  }

  async intakeProfile(
    request: LawbotBridgeIntakeProfileRequest
  ): Promise<BridgeIntakeProfileResponse> {
    return this.postJson<BridgeIntakeProfileResponse>({
      path: "/bridge/intake/profile",
      body: {
        request_id: request.requestId,
        fact_input: request.factInput,
        case_profile: request.caseProfile ?? null
      }
    });
  }

  async createDocumentDraft(
    request: LawbotBridgeDocumentDraftRequest
  ): Promise<BridgeDocumentDraftResponse> {
    return this.postJson<BridgeDocumentDraftResponse>({
      path: "/bridge/drafts/document",
      body: {
        request_id: request.requestId,
        draft_kind: request.draftKind,
        fact_input: request.factInput,
        case_profile: request.caseProfile ?? null,
        options: request.options ?? {}
      }
    });
  }

  async createCustomerMessageDraft(
    request: LawbotBridgeCustomerMessageDraftRequest
  ): Promise<BridgeCustomerMessageDraftResponse> {
    return this.postJson<BridgeCustomerMessageDraftResponse>({
      path: "/bridge/drafts/customer-message",
      body: {
        request_id: request.requestId,
        message_kind: request.messageKind,
        tone: request.tone,
        fact_input: request.factInput,
        case_profile: request.caseProfile ?? null
      }
    });
  }

  private async postJson<T>(request: RequestOptions): Promise<T> {
    // Check cache first
    const cacheKey = lawbotCache.generateKey({ path: request.path, ...request.body });
    const cached = lawbotCache.get(cacheKey);
    if (cached) {
      return cached.value as T;
    }

    let attempt = 0;
    let lastError: unknown;

    while (attempt <= this.config.maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const response = await this.fetchImpl(`${this.config.baseUrl}${request.path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "X-Lawbot-Service-Key": this.config.serviceKey,
            "X-Lawbot-Service-Caller": this.config.serviceCaller
          },
          body: JSON.stringify(request.body),
          signal: controller.signal
        });

        if (!response.ok) {
          const bodyText = await readResponseBody(response);
          const mapped = mapStatusError(response.status, bodyText);
          if (mapped instanceof LawbotBridgeServiceError && shouldRetryStatus(response.status) && attempt < this.config.maxRetries) {
            attempt += 1;
            await delay(this.config.retryBackoffMs);
            continue;
          }
          throw mapped;
        }

        const result = (await response.json()) as T;

        // Cache successful responses
        lawbotCache.set(cacheKey, result);

        return result;
      } catch (error) {
        lastError = error;
        if (isAbortError(error)) {
          if (attempt < this.config.maxRetries) {
            attempt += 1;
            await delay(this.config.retryBackoffMs);
            continue;
          }
          throw new LawbotBridgeTransportError(
            `Lawbot bridge request timed out after ${this.config.timeoutMs}ms.`
          );
        }

        if (error instanceof LawbotBridgeRequestError || error instanceof LawbotBridgeAuthError) {
          throw error;
        }

        if (error instanceof LawbotBridgeServiceError) {
          throw error;
        }

        if (attempt < this.config.maxRetries) {
          attempt += 1;
          await delay(this.config.retryBackoffMs);
          continue;
        }

        throw new LawbotBridgeTransportError("Lawbot bridge transport request failed.");
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new LawbotBridgeTransportError("Lawbot bridge transport request failed.");
  }
}

export function createLawbotBridgeHttpClientFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: FetchLike = fetch
) {
  return new LawbotBridgeHttpClient(
    {
      baseUrl: env.LAWBOT_BRIDGE_BASE_URL ?? "",
      serviceKey: env.LAWBOT_SERVICE_KEY ?? "",
      serviceCaller: env.LAWBOT_SERVICE_CALLER ?? "",
      timeoutMs: Number(env.LAWBOT_BRIDGE_TIMEOUT_MS ?? "50000"),
      maxRetries: Number(env.LAWBOT_BRIDGE_MAX_RETRIES ?? "0"),
      retryBackoffMs: Number(env.LAWBOT_BRIDGE_RETRY_BACKOFF_MS ?? "250")
    },
    fetchImpl
  );
}
