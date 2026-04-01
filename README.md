# WCA U.S. State Coverage Site

Public TanStack Start app for tracking which U.S. states a WCA competitor has competed in, plus a public leaderboard of the top 100 competitors by U.S. state coverage.

## Product goal

The planned V1 experience is:
- search by WCA ID
- show visited vs unvisited U.S. states
- show the last 3 competitions for each state
- show basic upcoming competitions for unvisited states when available
- publish a public top-100 leaderboard ordered by visited-state count

Primary planning artifacts live in:
- `.omx/plans/ralplan-wca-us-state-coverage-site.md`
- `.omx/plans/prd-wca-us-state-coverage-site.md`
- `.omx/plans/test-spec-wca-us-state-coverage-site.md`

## Current repository status

This repository is **not at the WCA product stage yet**. A quick code review of the current app shows that the main product work still needs to be implemented:

### UI / routing
- `src/routes/index.tsx` is still starter-template marketing content.
- `src/routes/__root.tsx` still renders a placeholder Mantine header with a `Region Tracker` button and starter page chrome.
- No competitor-detail route, leaderboard route, or WCA-specific homepage search flow exists yet.

### API / server layer
- `src/routes/api.$.ts`, `src/routes/api.rpc.$.ts`, and `src/orpc/router/*` still expose demo todo/oRPC plumbing.
- No WCA ingestion, leaderboard, or competitor-query server modules are present yet.

### Database layer
- `src/db/schema.ts` contains early region-tracking primitives only; it does not yet model competitions, state-to-competition mapping, or ingestion runs required by the V1 plan.
- `src/db/supabase/migrations/schema.ts` currently contains invalid TypeScript (`{this` inside the `regions` table definition) and should not be treated as a trustworthy schema baseline.
- `drizzle.config.ts` points at `src/db/schema.ts` as the source schema.

### Runtime / deployment
- `src/env.ts` currently validates only `DATABASE_POOLER_URL` plus optional client title metadata.
- `wrangler.jsonc` is configured only for the TanStack Start server entry; no scheduled ingestion trigger is defined yet.

## Recommended implementation order

Based on the current repo state and the plan artifacts, the next implementation milestones should be:

1. **Stabilize the baseline**
   - restore trustworthy build/test diagnostics
   - repair, regenerate, or exclude the broken migration helper TS artifact
2. **Expand the data model**
   - keep competitor/state coverage dimensions
   - add competitions, competition-to-state mapping, and ingestion-run tracking
3. **Build ingestion + query modules**
   - historical WCA export ingest
   - separate upcoming-competition enrichment
   - leaderboard and competitor query layer
4. **Replace starter UI**
   - homepage search
   - competitor detail route
   - leaderboard route
5. **Add scheduled execution + operations docs**
   - scheduled Cloudflare entrypoint
   - ingestion/recovery/runbook documentation

## Local development

Install dependencies and start the dev server:

```bash
pnpm install
pnpm dev
```

Key project commands:

```bash
pnpm build
pnpm test
pnpm check
pnpm db:generate
pnpm db:push
```

## Verification guidance

Use these checks before calling feature work complete:

```bash
npx tsc --noEmit
pnpm check
pnpm test
pnpm build
```

Feature verification should additionally cover:
- valid WCA ID lookup
- not-found WCA ID state
- visited vs unvisited U.S. state partitioning
- last-3 historical competitions per state
- graceful upcoming-competition unavailable states
- deterministic leaderboard ordering (`visited_state_count DESC`, then `wca_id ASC`)

## Notes for future contributors

- Treat `.omx/plans/`, `.omx/plans/prd-*.md`, and `.omx/plans/test-spec-*.md` as planning inputs, not implementation outputs.
- Keep `src/db/schema.ts` as the schema authority unless the team intentionally changes that contract.
- Remove or replace starter/demo surfaces instead of extending them as if they were production WCA features.
- Keep upcoming-competition enrichment logically separate from historical coverage derivation so future-event failures do not break the core coverage experience.
