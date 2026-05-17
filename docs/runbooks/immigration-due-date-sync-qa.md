# Immigration dueDate Sync QA Runbook

## 1. Purpose

This runbook defines the safe QA procedure for syncing `ImmigrationCaseDetail` deadline values into `CaseMatter.dueDate`.

Core lessons:

- CLI/direct `PATCH` may need a same-origin `Origin` header.
- Capturing HTTP status and response body together can make client status and app log correlation ambiguous.
- Before retrying production, reproduce the same payload and headers in staging.

## 2. Background

The first production dueDate sync `PATCH` returned client status `400`, did not confirm `{ ok: true }`, and did not show expected values on follow-up GET.

Source checks showed:

- request body validation passed locally.
- the route success path returns only `{ ok: true }` with status `200`.
- staging passed when the request used same-origin `Origin` and separate status/body capture.
- production then passed with the same request discipline.

Most likely cause: direct CLI request Origin/header/capture/correlation issue, not service or body logic.

## 3. Required Safety Rules

- Use only QA NON_CUSTOMER cases.
- Do not use actual customer data.
- Run production `PATCH` only after explicit approval.
- Run production `PATCH` exactly once per approval.
- Do not retry the same failed step.
- Capture status and body separately.
- Include same-origin `Origin`.
- Include a non-secret `x-qa-request-id`.
- Do not print secrets, tokens, auth headers, DB URLs, or bypass secrets.
- Do not stage or commit `.env*` files.
- Do not directly edit production DB data.
- Do not run seed scripts.
- Do not run provider/send, Lawbot, or Auto-Sns actions.
- Do not upload files or generate documents.

## 4. Required Headers

Use these headers for dueDate sync `PATCH`:

- `Origin: <production-or-preview-origin>`
- `x-qa-request-id: <non-secret-qa-id>`
- `Content-Type: application/json`
- Admin Basic Auth
- Vercel bypass header only for protected Preview deployments that require it

Never print Admin Basic Auth or Vercel bypass values.

## 5. Status / Body Capture

Do not use combined write-out output where status and response body are mixed.

Required capture:

- `tmp/status.txt`: HTTP status only
- `tmp/body.json`: response body only

Delete temp files after QA.

Success criteria:

- status is `200`
- body is `{ "ok": true }`
- follow-up GET shows the updated values
- `IMMIGRATION_CASE_DETAIL_UPDATED` event is visible
- logs show the same request as status `200`

## 6. Staging QA Procedure

1. Confirm the staging or Preview DB is separate from production.
2. Set branch-specific Preview env only.
3. Redeploy Preview.
4. Confirm readiness:
   - public routes return `200`
   - unauth admin routes return `401`
   - admin-auth routes return `200`
   - logs show no `P1001`, `P2021`, or table/relation/enum missing errors
5. Create or find a QA NON_CUSTOMER intake/case.
6. Run one dueDate sync `PATCH`.
7. Confirm read-after-write.
8. Confirm log correlation.
9. Remove branch-specific Preview env.
10. Delete temp files.

## 7. Production QA Procedure

Prerequisites:

- staging passed with the same payload and header pattern.
- target case is confirmed QA NON_CUSTOMER.
- production `PATCH` has explicit one-time approval.

Known QA target:

- case id: `cmp2fx7lu0001jo04o9ln83d8`
- title: `QA NON_CUSTOMER Case Card Production Read-Only Test`

Production requirements:

- include same-origin `Origin`
- include `x-qa-request-id`
- capture status/body separately
- run `PATCH` exactly once
- run follow-up GET
- confirm logs correlation
- do not retry without new approval

## 8. Example PATCH Body

Use QA-only non-sensitive values.

```json
{
  "dispositionType": "VISA_ISSUANCE_SUPPORT",
  "appealDeadline": "2026-05-22",
  "submissionDeadline": "2026-05-25",
  "resultExpectedDate": "2026-06-10",
  "nationality": "QA",
  "currentStayStatus": "QA status",
  "familyInKoreaSummary": "QA-only production dueDate sync family summary.",
  "residenceBaseSummary": "QA-only production dueDate sync correlation marker.",
  "employmentOrSchoolSummary": "QA-only production dueDate sync employment summary.",
  "violationHistorySummary": "QA-only none summary.",
  "scopeReviewRequired": true,
  "attorneyScopeRisk": false,
  "officialFormCheckRequired": true,
  "deadlineVerifiedAt": "2026-05-17",
  "verifiedBy": "QA Operator",
  "actorName": "QA Operator",
  "syncCaseMatterDueDate": true
}
```

## 9. Pass Criteria

- `PATCH` status is `200`.
- response body is `{ "ok": true }`.
- detail GET shows updated dates.
- `CaseMatter.dueDate` reflects the expected priority field.
- `IMMIGRATION_CASE_DETAIL_UPDATED` event is visible.
- logs show matching `PATCH` status `200`.
- logs show no `P1001`, `P2021`, table missing, relation missing, or enum missing errors.
- response/body/logs contain no secret or internal fields.
- no external side effects occurred.

## 10. Fail / Stop Criteria

Stop immediately if any of these happen:

- target case is wrong
- actual customer data appears
- status is not `200`
- body is not `{ "ok": true }`
- follow-up GET does not show expected values
- logs do not match client status
- secret/header/token leak risk appears
- Origin error appears
- validation error appears
- DB table/relation error appears

If production fails, do not retry production. Reproduce and diagnose in staging first.

## 11. Cleanup

- Delete temp status/body files.
- Remove branch-specific Preview env.
- Confirm no Vercel bypass secret was saved.
- Confirm `.env*` files were not staged.
- Record production mutation count.
