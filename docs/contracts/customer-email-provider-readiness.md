# Customer Email Provider Readiness Contract

## Current Scope

Customer email delivery remains disabled. The system may render previews and
record dry-run or manual audit events, but it must not send real email until a
separate approval enables a real provider.

The current provider implementation is:

- default provider: `dry-run`
- Resend implementation: disabled stub only
- real provider calls: not implemented
- provider SDK imports: not allowed
- provider HTTP calls: not allowed
- `client-message-service` integration: not allowed
- `dispatchInitialClientMessage` integration: not allowed

## Readiness DTO

Provider readiness may be exposed to an admin-only view in a later phase. The
DTO must not include secret values, raw env values, full email addresses, API
keys, webhook secrets, provider tokens, or message bodies.

Allowed readiness fields:

- `provider`
- `providerEnabled`
- `realSendEnabled`
- `dryRunOnly`
- `externalActionAllowed`
- `canUseRealProvider`
- `canSendRealEmail`
- `blockedReasonCodes`
- `hasApiKey`
- `hasFromAddress`
- `hasReplyTo`
- `hasAllowedDomain`
- `fromDomainAllowed`
- `providerImplementationStatus`

Until a real provider is explicitly implemented and approved:

- `dryRunOnly` must be `true`
- `externalActionAllowed` must be `false`
- `canUseRealProvider` must be `false`
- `canSendRealEmail` must be `false`
- `providerImplementationStatus` must be `stub_only`, `not_configured`, or
  `disabled`

## Blocking Reason Codes

Readiness should use stable reason codes:

- `PROVIDER_DISABLED`
- `REAL_SEND_DISABLED`
- `PROVIDER_IMPLEMENTATION_STUB_ONLY`
- `API_KEY_MISSING`
- `FROM_ADDRESS_MISSING`
- `ALLOWED_DOMAIN_MISSING`
- `FROM_DOMAIN_NOT_ALLOWED`

## Resend Stub Contract

The disabled Resend stub exists only to lock the future provider boundary. It
must not import the Resend SDK, call provider APIs, use `fetch`, or return a
successful send result.

Required result shape:

- `providerName=resend-disabled`
- `providerCalled=false`
- `dryRunOnly=true`
- `externalActionAllowed=false`
- `status=FAILED`
- `failureReasonCode=PROVIDER_IMPLEMENTATION_STUB_ONLY`
- no `messageId`

## Future Real Provider Checklist

Before any real email provider can be enabled:

1. Verify the sending domain.
2. Configure SPF, DKIM, and DMARC.
3. Set an approved `EMAIL_FROM` address on the verified domain.
4. Set an operational `EMAIL_REPLY_TO` address.
5. Configure the provider API key as a secret.
6. Keep `EMAIL_REAL_SEND_ENABLED=false` until the final approval step.
7. Perform one dedicated test-inquiry send only after approval.
8. Confirm provider message id capture.
9. Confirm duplicate/idempotency protection.
10. Confirm rollback by disabling the provider flag.

## Rollback

Rollback must be flag-based:

- turn real-send flag off
- fall back to dry-run behavior
- keep duplicate prevention active
- keep failure audit events
- do not auto-retry failed provider sends

## Forbidden Data

Provider readiness, disabled stub responses, and future send responses must not
expose:

- internal inquiry id or case id
- workflow status or bridge workflow status
- Lawbot status or approval gates
- document/message drafts
- communication log raw JSON
- admin notes
- provider API keys or webhook secrets
- raw message body, text, or HTML
