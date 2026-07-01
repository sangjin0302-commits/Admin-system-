# Lawbot Setup

The Admin system delegates AI legal analysis to the **Lawbot** service hosted on Railway:

> https://lawbot-web-production-e49b.up.railway.app

This document lists the environment variables required to connect Admin to Lawbot, and how to configure them on Vercel for production.

## Required environment variables

Add these to `.env.local` (dev) and to Vercel Project Settings → Environment Variables (prod):

```bash
# Lawbot Bridge (Railway) - required for AI legal analysis
LAWBOT_BRIDGE_BASE_URL="https://lawbot-web-production-e49b.up.railway.app"
LAWBOT_SERVICE_KEY=""            # request from lawbot admin
LAWBOT_SERVICE_CALLER="admin-system"
LAWBOT_BRIDGE_TIMEOUT_MS="8000"

# Lawbot Analyze (legacy endpoint, still used by some code paths)
LAWBOT_ANALYZE_URL="https://lawbot-web-production-e49b.up.railway.app/analyze/admin"
LAWBOT_ANALYZE_TOKEN=""
LAWBOT_ANALYZE_TIMEOUT_MS="8000"
```

- `LAWBOT_SERVICE_KEY` must be requested from the Lawbot admin. Do **not** commit this value.
- `LAWBOT_SERVICE_CALLER` should stay `admin-system` — Lawbot uses it to route/authorize the request.
- `LAWBOT_ANALYZE_TOKEN` is the legacy static token; keep it non-empty in prod until legacy paths are retired.

## Setting on Vercel (production)

1. Open the Vercel dashboard.
2. Navigate to the `ethos` (Admin) project → **Settings** → **Environment Variables**.
3. Add each variable above. Select **Production**, **Preview**, and **Development** as appropriate (secret values → Production only).
4. Redeploy so the new variables take effect.

## Recent fix

The previous `.env.local` had a duplicate-prefix bug:

```
LAWBOT_ANALYZE_URL="LAWBOT_ANALYZE_URL=https://lawbot-web-production-e49b.up.railway.app/analyze/admin"
```

This caused Admin to POST to a URL like `LAWBOT_ANALYZE_URL=https://...` and every Lawbot call to fail. Corrected to:

```
LAWBOT_ANALYZE_URL="https://lawbot-web-production-e49b.up.railway.app/analyze/admin"
```

## Health check

Verify connectivity to the Lawbot bridge (replace `$LAWBOT_SERVICE_KEY` with the real key):

```bash
curl -X POST https://lawbot-web-production-e49b.up.railway.app/bridge/intake/analyze \
  -H "X-Lawbot-Service-Key: $LAWBOT_SERVICE_KEY" \
  -H "X-Lawbot-Service-Caller: admin-system" \
  -H "Content-Type: application/json" \
  -d '{"request_id":"test","intake":{"fact_input":"테스트","attachments_present":false,"channel":"admin-system"},"options":{}}'
```

A `200` response with a JSON body confirms the bridge is reachable and the service key is valid. `401`/`403` means the service key is wrong or missing. `5xx` means the Railway service is down — check its Railway dashboard.
