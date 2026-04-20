# AI Workflow (Admin System)

## Principle
AI/Lawbot output is internal assistance, not final client-facing legal conclusion.

## Processing order
1. Input normalization
2. Policy/safety check
3. Integration call
4. Contract validation
5. Structured outcome (`success` / `skipped_by_policy` / `failed`)
6. Snapshot persistence (when allowed)

## Must-have guards
- Missing integration config => `skipped_by_policy`
- Contract mismatch => `failed` (`contract_validation_failed`)
- Timeout/network/upstream errors => `failed` with explicit reason code
