# Railway Postgres Operations

## Recommended setup

- Local development: SQLite
- Production database: Railway Postgres
- Human-readable mirror: Notion
- Restore safety net: Railway backups + external `pg_dump`

`system(admin-office-mvp)` should treat Railway Postgres as the source of truth for inquiry, quote, case, and Lawbot snapshot data.

## Railway connection

Use the full Railway-provided `DATABASE_URL` in the deployment environment.

Example shape:

```env
DATABASE_URL=postgresql://USER:PASSWORD@monorail.proxy.rlwy.net:46311/railway
```

The `monorail.proxy.rlwy.net:46311` host itself is not a problem. It is a Railway proxy endpoint. What matters is:

- the credentials are correct
- the database name is correct
- the full URL comes from Railway variables instead of manual copy mistakes
- production uses the Railway URL consistently

Do not treat the host and port as suspicious just because they are not a typical `localhost:5432` shape.

## Backup policy

### 1. Primary backup

Enable Railway backup scheduling for the production database.

Recommended minimum:

- daily backup
- retain multiple restore points

### 2. Secondary backup

Create a recurring external dump:

```bash
pg_dump "$DATABASE_URL" > admin-office-mvp-YYYYMMDD.sql
```

Store it outside Railway, such as:

- private cloud storage
- encrypted local archive
- secured team backup folder

Recommended minimum:

- weekly full dump
- keep several historical copies

### 3. Notion mirror

Notion is not a database backup.

Use Notion for:

- inquiry summary
- Lawbot practical notes
- checklist and handoff notes
- human-readable audit trail

Do not rely on Notion for point-in-time database recovery.

## Migration direction

Recommended operating model:

1. Keep SQLite for fast local development.
2. Use Railway Postgres for staging or production.
3. Keep Prisma schema compatible with Postgres-first operation.
4. Store structured operational memos in the inquiry record so restored data is still understandable.

## Restore checklist

If data integrity becomes suspicious:

1. Stop risky status changes first.
2. Compare current inquiry record with saved Lawbot snapshot.
3. Check structured internal memo summary.
4. Review Railway restore points.
5. Restore from Railway backup or external `pg_dump` if needed.
6. Use Notion notes only as a human confirmation layer.
