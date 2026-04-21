# Testing Guide (Stability First)

## Minimum checks per integration change
1. `npm run text:check`
2. `npm run typecheck`

## Recommended checks
1. `npm run build:prepare`
2. `npm run ops:smoke:local` (with local server up)

## Windows spawn EPERM triage chain
If `npm run dev` or `npm run build` hangs or fails with `spawn EPERM`, use this order first:

1. `npm run preflight:spawn`
2. `npm run preflight:locks`
3. `npm run verify:safe`
4. `npm run verify:safe:strict` (only when preflight is PASS)

Notes:
- `preflight:spawn` isolates whether Node can create child processes at all.
- If `preflight:spawn` returns EPERM, treat this as an environment/runtime blocker (policy/permission/EDR/sandbox), not a CaseMatter domain-logic bug.
- `verify:safe` intentionally avoids `next build` and gives a fast, bounded validation path.
- `build:prepare` can return via Prisma fallback in EPERM conditions. Check `RESULT` lines:
  - `prisma-generate-auto RESULT=PASS` means generate actually succeeded.
  - `prisma-generate-auto RESULT=FALLBACK` means it only passed with an existing client.
- Do not treat fallback-only pass as runtime health.

See also:
- `docs/troubleshooting/windows-spawn-eperm.md`

## Build note (Windows + OneDrive)
`next build` may appear stalled due to file-lock/EPERM behavior.
Prefer:
- stopping stale node processes
- running checks above first
- using non-OneDrive path for deterministic full build verification
