# Policy Invariants

## Integration invariants
- Missing integration URL/token must not execute remote calls.
- Policy-blocked operations must return `skipped_by_policy`, not runtime exception.
- Runtime/infra failures must return `failed` with reason code.

## Lawbot invariants (admin-system boundary)
- Response must pass contract normalization before UI/persistence usage.
- Invalid response shape must not be persisted as trusted snapshot.
- Manual trigger is allowed even when automatic trigger is disabled.
