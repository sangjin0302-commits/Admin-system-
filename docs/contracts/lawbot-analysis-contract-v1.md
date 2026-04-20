# Lawbot Analysis Contract v1

## Goal
Prevent fragile integration by making admin-system interpret Lawbot responses with a stable contract.

## Result Envelope
`LawbotCaseAnalysisResult` must follow one of:

- `status: "available"` with `data`
- `status: "disabled"` with `message`
- `status: "error"` with `message`

Optional `outcome` can be attached for operations visibility:

```ts
type LawbotOperationOutcome = {
  status: "success" | "skipped_by_policy" | "failed";
  reasonCode:
    | "analysis_completed"
    | "missing_analyze_url"
    | "automatic_calls_disabled"
    | "request_timeout"
    | "upstream_http_error"
    | "contract_validation_failed"
    | "network_error";
};
```

## Policy Defaults
- Automatic Lawbot calls are disabled by default.
- Manual trigger path is API-based (`/api/admin/inquiries/:id/lawbot-analysis`).
- Automatic call enable flag: `LAWBOT_ENABLE_AUTOMATIC_CALLS=true`.

## Fail-Closed Rules
- If `LAWBOT_ANALYZE_URL` is missing, return `disabled` + `skipped_by_policy`.
- If automatic calls are disabled, return `disabled` + `skipped_by_policy`.
- Network/timeout/upstream errors return `error` + `failed`.
- Invalid response shape returns `error` + `contract_validation_failed`.

## Compatibility Notes
- `outcome` remains optional in result type for backwards compatibility with legacy UI/state objects.
- New code paths should attach `outcome` whenever possible.
