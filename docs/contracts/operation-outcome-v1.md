# Operation Outcome Standard v1

## Purpose
Reduce "fixed one path, broke another" incidents by separating policy blocks from real failures.

## Standard Statuses
- `success`: action completed.
- `skipped_by_policy`: action intentionally blocked by guard/policy.
- `failed`: action attempted but failed technically.

## Required Logging Fields
- `status`
- `reasonCode`
- `action`
- `contextId` (inquiry/case/quote id)

## Admin-system Initial Scope
- Lawbot analysis execution result (`getLawbotCaseAnalysis`) now follows this pattern.
- Production env check validates Lawbot automatic-call config for safe operation.

## Rollout Rule
When touching integrations (Lawbot, Notion, market sync), new paths should emit this standard outcome.
