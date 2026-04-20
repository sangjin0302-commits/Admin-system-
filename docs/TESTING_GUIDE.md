# Testing Guide (Stability First)

## Minimum checks per integration change
1. `npm run text:check`
2. `npm run typecheck`

## Recommended checks
1. `npm run build:prepare`
2. `npm run ops:smoke:local` (with local server up)

## Build note (Windows + OneDrive)
`next build` may appear stalled due to file-lock/EPERM behavior.
Prefer:
- stopping stale node processes
- running checks above first
- using non-OneDrive path for deterministic full build verification
