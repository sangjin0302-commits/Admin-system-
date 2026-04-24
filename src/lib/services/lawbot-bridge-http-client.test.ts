import assert from "node:assert/strict";

import {
  LawbotBridgeAuthError,
  LawbotBridgeHttpClient,
  LawbotBridgeRequestError,
  LawbotBridgeServiceError,
  LawbotBridgeTransportError,
  createLawbotBridgeHttpClientFromEnv
} from "./lawbot-bridge-http-client.ts";

async function testRequestShapeAndHeaderInjection() {
  const calls: Array<{
    url: string;
    init: RequestInit;
  }> = [];

  const client = new LawbotBridgeHttpClient(
    {
      baseUrl: "https://lawbot.example.com/",
      serviceKey: "secret-key",
      serviceCaller: "admin-backend",
      timeoutMs: 200,
      maxRetries: 0
    },
    async (input, init) => {
      calls.push({
        url: String(input),
        init: init ?? {}
      });
      return new Response(
        JSON.stringify({
          review_required: true,
          must_verify: ["confirm filing timeline"]
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
  );

  const response = await client.createDocumentDraft({
    requestId: "req-1",
    draftKind: "admin_appeal_brief",
    factInput: "Client received refusal disposition.",
    caseProfile: {
      inquiry_id: "inq_1",
      workflow_status: "PROFILED"
    },
    options: {
      includeTraceability: true
    }
  });

  assert.equal(response.review_required, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, "https://lawbot.example.com/bridge/drafts/document");
  assert.equal(calls[0]?.init.method, "POST");

  const headers = new Headers(calls[0]?.init.headers);
  assert.equal(headers.get("Content-Type"), "application/json; charset=utf-8");
  assert.equal(headers.get("X-Lawbot-Service-Key"), "secret-key");
  assert.equal(headers.get("X-Lawbot-Service-Caller"), "admin-backend");

  const body = JSON.parse(String(calls[0]?.init.body));
  assert.deepEqual(body, {
    request_id: "req-1",
    draft_kind: "admin_appeal_brief",
    fact_input: "Client received refusal disposition.",
    case_profile: {
      inquiry_id: "inq_1",
      workflow_status: "PROFILED"
    },
    options: {
      includeTraceability: true
    }
  });
}

async function testRetryAndServiceErrorMapping() {
  let attempts = 0;

  const client = new LawbotBridgeHttpClient(
    {
      baseUrl: "https://lawbot.example.com",
      serviceKey: "secret-key",
      serviceCaller: "admin-backend",
      timeoutMs: 200,
      maxRetries: 1,
      retryBackoffMs: 1
    },
    async () => {
      attempts += 1;
      if (attempts === 1) {
        return new Response("temporary failure", { status: 503 });
      }
      return new Response(JSON.stringify({ review_required: false }), {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
  );

  const response = await client.intakeAnalyze({
    requestId: "req-2",
    factInput: "test"
  });

  assert.equal(response.review_required, false);
  assert.equal(attempts, 2);
}

async function testRequestAndAuthErrorMapping() {
  const requestClient = new LawbotBridgeHttpClient(
    {
      baseUrl: "https://lawbot.example.com",
      serviceKey: "secret-key",
      serviceCaller: "admin-backend",
      timeoutMs: 200,
      maxRetries: 1
    },
    async () => new Response("bad payload", { status: 422 })
  );

  await assert.rejects(
    () =>
      requestClient.intakeProfile({
        requestId: "req-3",
        factInput: "test"
      }),
    (error: unknown) => error instanceof LawbotBridgeRequestError && error.status === 422
  );

  const authClient = new LawbotBridgeHttpClient(
    {
      baseUrl: "https://lawbot.example.com",
      serviceKey: "secret-key",
      serviceCaller: "admin-backend",
      timeoutMs: 200,
      maxRetries: 1
    },
    async () => new Response("forbidden", { status: 403 })
  );

  await assert.rejects(
    () =>
      authClient.intakeAnalyze({
        requestId: "req-4",
        factInput: "test"
      }),
    (error: unknown) => error instanceof LawbotBridgeAuthError && error.status === 403
  );
}

async function testTimeoutAndTransportError() {
  const client = new LawbotBridgeHttpClient(
    {
      baseUrl: "https://lawbot.example.com",
      serviceKey: "secret-key",
      serviceCaller: "admin-backend",
      timeoutMs: 10,
      maxRetries: 0
    },
    (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      })
  );

  await assert.rejects(
    () =>
      client.createCustomerMessageDraft({
        requestId: "req-5",
        messageKind: "document_followup",
        factInput: "test"
      }),
    (error: unknown) => error instanceof LawbotBridgeTransportError
  );
}

async function testEnvFactory() {
  const calls: string[] = [];
  const client = createLawbotBridgeHttpClientFromEnv(
    {
      NODE_ENV: "test",
      LAWBOT_BRIDGE_BASE_URL: "https://lawbot.example.com",
      LAWBOT_SERVICE_KEY: "env-secret",
      LAWBOT_SERVICE_CALLER: "env-caller",
      LAWBOT_BRIDGE_TIMEOUT_MS: "1234",
      LAWBOT_BRIDGE_MAX_RETRIES: "0"
    },
    async (input) => {
      calls.push(String(input));
      return new Response(JSON.stringify({ review_required: false }), {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
  );

  await client.intakeAnalyze({
    requestId: "req-6",
    factInput: "test"
  });

  assert.equal(calls[0], "https://lawbot.example.com/bridge/intake/analyze");
}

async function testNonRetryableServiceFailure() {
  const client = new LawbotBridgeHttpClient(
    {
      baseUrl: "https://lawbot.example.com",
      serviceKey: "secret-key",
      serviceCaller: "admin-backend",
      timeoutMs: 200,
      maxRetries: 1
    },
    async () => new Response("unavailable", { status: 503 })
  );

  await assert.rejects(
    () =>
      client.intakeAnalyze({
        requestId: "req-7",
        factInput: "test"
      }),
    (error: unknown) => error instanceof LawbotBridgeServiceError && error.status === 503
  );
}

async function run() {
  await testRequestShapeAndHeaderInjection();
  await testRetryAndServiceErrorMapping();
  await testRequestAndAuthErrorMapping();
  await testTimeoutAndTransportError();
  await testEnvFactory();
  await testNonRetryableServiceFailure();

  console.log("lawbot-bridge-http-client-test-ok");
}

run();
