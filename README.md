# WCA Region Coverage

Public TanStack Start app for:
- searching competitors by WCA ID
- counting region coverage across the United States, Canada, and England
- showing visited vs unvisited regions within the selected scope
- publishing a top-N leaderboard by visited regions within each scope

Historical data is sourced from the official weekly WCA export:
`https://www.worldcubeassociation.org/api/v0/export/public`

## Data pipeline

The project now uses a DB-backed weekly ingestion pipeline:

1. Fetch latest export metadata (`export_date`, `tsv_url`)
2. Download and parse the TSV ZIP
3. Ingest:
   - `WCA_export_persons.tsv`
   - `WCA_export_competitions.tsv`
   - `WCA_export_results.tsv`
4. Build and persist:
   - `wca_people`
   - `wca_regions`
   - `regional_competitions`
   - `person_regional_competitions`
   - `person_country_region_summary`
   - `wca_export_runs` (run status/metrics)

Scheduler:
- GitHub Actions workflow at `.github/workflows/wca-weekly-ingest.yml`
- Runs weekly (Monday UTC) and supports manual dispatch
- Uses the same cron entrypoint as local one-shot execution

## Local development

```bash
pnpm install
pnpm dev
```

## Commands

```bash
pnpm build
pnpm test
pnpm check
pnpm db:generate
pnpm db:push
pnpm ingest:wca-weekly
pnpm cron:wca-once
pnpm cron:wca-local
```

Cron usage:
- `pnpm cron:wca-once` runs one ingestion immediately (used in deployed workflow).
- `pnpm cron:wca-local` starts a local scheduler that triggers at `WCA_CRON` (default `0 6 * * 1`, UTC).
- Optional env for local scheduler:
  - `WCA_CRON` (supported format: `m h * * d`)
  - `WCA_CRON_POLL_MS` (default `30000`)
- For quick local testing:
  - set `WCA_CRON` to the next UTC minute/hour or use `pnpm cron:wca-once`.

## Environment variables

Required for app/runtime queries:
- `DATABASE_POOLER_URL`

Required for ingestion job (prefer direct connection):
- `DATABASE_DIRECT_URL` (preferred)
- or `DATABASE_POOLER_URL`

## Verification checklist

- WCA ID lookup resolves known competitors
- Unknown WCA ID shows not-found state
- Leaderboard supports `?n=` and clamps to `1..500`
- Ordering is deterministic:
  - `visited_regions_count DESC`
  - `wca_id ASC`
- Weekly ingestion is idempotent for already-succeeded exports
- Failed runs preserve last successful dataset
