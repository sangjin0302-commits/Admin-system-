# Cleanup Notes

## Files exceeding 500 lines (refactor candidates)

- src/lib/services/case-matter-service.ts — 2224
- src/lib/services/lawbot-bridge-review-view-models.ts — 1209
- src/components/intake/intake-form-safe-v3.tsx — 1130
- src/app/admin/document-lab/page.tsx — 784
- src/lib/immigration/immigration-appeal-registry.ts — 717
- src/components/admin/lawbot-review-readonly-client.tsx — 682
- src/lib/services/customer-notification-send-service.test.ts — 680
- src/lib/integrations/notion.ts — 670
- src/components/admin/quote-workspace.tsx — 654
- src/components/admin/lawbot-case-analysis-panel.tsx — 647
- src/app/admin/dashboard-content.tsx — 643
- src/lib/services/customer-notification-send-service.ts — 613
- src/lib/services/lawbot-bridge-case-workflow-service.ts — 595

In the recently-created admin areas, all files stay under 300 lines. Largest is
src/app/admin/crm/[email]/page.tsx (265).

## console.log statements in production code

- src/app/admin/cases/kanban/kanban-shell.tsx:10 — `console.log(\`[Kanban] status change: ${caseId} → ${newStatus}\`)` — replace with structured logger or remove
- src/app/admin/document-lab/page.test.ts:133 — `console.log("document lab page source checks passed")` — test-only, low priority

## Duplicate code patterns observed

- Each new admin page repeats the same header pattern (Card + ui-kicker + ui-page-title + description). A shared `<AdminPageHeader kicker title description />` component would remove ~10 lines per page across blog/crm/webhooks/audit/kpi/payments/signatures/settings/kakao/win-rate/doc-generator.
- POST API routes under src/app/api/admin/* repeat the same try/catch + 400/500 NextResponse shape. Extract a `withJsonBody(schema, handler)` helper.
- Status badge styling (`bg-emerald-100 text-emerald-800` vs `bg-rose-100 text-rose-800`) is inlined in payments, webhooks, signatures. Promote to `<StatusPill kind="success|error|pending">`.

## Recommended next refactoring targets (priority order)

1. Split case-matter-service.ts (2224 lines) by domain concern — likely 4-5 files.
2. Extract AdminPageHeader component (touches 10+ pages).
3. Break intake-form-safe-v3.tsx into step components.
4. Consolidate POST route boilerplate with a small zod-style validator helper.
5. Replace the kanban console.log with the project's existing logger.
