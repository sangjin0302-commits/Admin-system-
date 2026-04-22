# Docker SQLite Operations (Admin-system-)

## Goal
- Run `Admin-system-` on Docker without feature changes.
- Keep SQLite for cost-saving single-node operation.
- Persist DB on a Docker volume (not baked into image).

## 1) Prepare local Docker env
1. Copy `.env.docker.example` to `.env.docker.local`.
2. Fill required values for your environment.
3. Do not commit `.env.docker.local`.

```powershell
Copy-Item .env.docker.example .env.docker.local
```

## 2) Start
```powershell
docker compose up -d --build
```

## 3) Stop
```powershell
docker compose down
```

## 4) Data persistence
- SQLite path in container: `/app/prisma/dev.db`
- Docker volume: `admin_system_prisma_data`
- Data remains after restart unless you remove volumes.

## 5) Host networking note (127.0.0.1)
- Inside a container, `127.0.0.1` points to the container itself.
- If Lawbot runs on the host, use:
  - `LAWBOT_ANALYZE_URL=http://host.docker.internal:8000/analyze/admin`

## 6) Safety notes
- Never commit `.env` or `.env.docker.local`.
- `docker compose down -v` removes volume data.
