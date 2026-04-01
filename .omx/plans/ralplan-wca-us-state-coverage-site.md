# RALPLAN — WCA U.S. State Coverage Site

## Requirements Summary
Build a public, U.S.-only WCA statistics site in this TanStack Start repo. Users must be able to search by WCA ID, view visited and unvisited U.S. states, see the last 3 competitions per state, inspect basic upcoming competitions for unvisited states, and browse a top-100 leaderboard ranked by U.S. states visited.

The current repo is still scaffold-heavy: the homepage is starter content (`src/routes/index.tsx:1-87`), the root shell is placeholder Mantine UI with a `Region Tracker` button (`src/routes/__root.tsx:42-114`), and the API/oRPC layers still point at demo todo logic (`src/routes/api.$.ts:13-77`, `src/routes/api.rpc.$.ts:7-29`, `src/orpc/router/index.ts:1-5`, `src/orpc/router/todos.ts:1-20`). The DB schema already contains region-tracking primitives (`src/db/schema.ts:9-47`) but not the full competition/upcoming-ingestion model needed for V1.

## Repo-grounded facts
- Existing Postgres/Drizzle setup is live through `src/db/index.ts:1-5` and `drizzle.config.ts:4-12`; `drizzle.config.ts:4-10` names `src/db/schema.ts` as the authoritative schema source and `src/db/supabase/migrations/` as generated migration output.
- `src/db/supabase/migrations/schema.ts:17-27` currently contains a syntax error (`{this`) and cannot be treated as a clean baseline artifact.
- `src/env.ts:4-39` currently validates only `DATABASE_POOLER_URL`; any new ingestion/runtime config will need env schema updates.
- Cloudflare/Wrangler is configured for the app entrypoint only; there is no scheduled trigger yet in `wrangler.jsonc:1-6`.
- Better Auth exists (`src/lib/auth.ts:1-7`, `src/routes/api/auth/$.ts:1-10`) but V1 explicitly does not need accounts.
- `tsconfig.json:1-29` includes all `**/*.ts` and `**/*.tsx`, so the broken file at `src/db/supabase/migrations/schema.ts:17-27` currently pollutes project-wide TypeScript/build diagnostics even though `drizzle.config.ts` points to `src/db/schema.ts` as the schema source of truth.
- `src/routes/__root.tsx:84-94` currently inlines its header shell, so `src/components/Header.tsx` and `src/components/Footer.tsx` are not yet the active app chrome and should not be treated as guaranteed integration points.
- Local verification is currently blocked by a pre-existing optional Rollup dependency issue (`@rollup/rollup-linux-x64-gnu` missing), so build/test readiness is not yet trustworthy until dependencies are repaired.

## Acceptance Criteria
1. Searching a valid WCA ID loads a competitor view.
2. The competitor view shows total visited U.S. states.
3. The competitor view separates visited and unvisited U.S. states.
4. Each state entry can show the last 3 competitions for that state.
5. Unvisited states show next upcoming competitions when present.
6. Upcoming competition entries expose only basic info: name, date, city, WCA link.
7. A public leaderboard shows the top 100 competitors by U.S. states visited, ordered by visited-state count descending and then WCA ID ascending.
8. State coverage is derived from at least one official WCA result in that state.
9. No V1 surface includes accounts, maps, filters, non-U.S. regions, manual edits, or travel-planning features.

## RALPLAN-DR Summary
### Principles
1. **Precompute expensive geography stats** so public lookups and leaderboard reads stay simple and cheap.
2. **Keep V1 informational**: expose coverage and upcoming competitions, not travel-planning workflows.
3. **Favor repo-native TanStack Start patterns** over adding extra infrastructure or dependencies.
4. **Separate ingestion from presentation** so failed syncs do not break the public site, and scheduled jobs do not depend on request-time adapters.
5. **Split authoritative history from soft-fail upcoming enrichment** so leaderboard/history correctness never depends on future-events fetch health.
6. **Prefer deterministic outputs** for ranking, partitioning, and scheduled sync behavior.

### Decision Drivers
1. **Fast public reads** for WCA ID lookup and leaderboard pages
2. **Operational simplicity** on the existing Cloudflare + Postgres + Drizzle stack
3. **Low-scope V1 delivery** without accounts, maps, or admin tooling

### Viable Options
#### Option A — Shared WCA domain modules + split historical/upcoming ingestion + DB-backed app queries **(Chosen)**
Build reusable server-side WCA domain modules that normalize competitors, states, and competitions into Postgres, run authoritative historical ingestion manually in development and via schedule in production, keep upcoming-competition enrichment as a separate soft-fail process/table, and serve the UI through route loaders/server functions.
- **Pros:** fast public reads, deterministic leaderboard generation, aligns with cron requirement, minimizes runtime dependence on external WCA availability.
- **Cons:** requires schema expansion and ingestion work before the UI is useful.

#### Option B — On-demand parsing + external lookups at request time
Store the raw export artifact and compute competitor/state views on user request, fetching upcoming competitions live.
- **Pros:** less initial ETL design.
- **Cons:** much slower requests, harder ranking, repeated compute, more fragile external dependence.

#### Option C — Thin UI over external WCA endpoints only
Avoid local normalization and rely primarily on WCA endpoints plus minimal caching.
- **Pros:** smallest local DB footprint.
- **Cons:** poor fit for leaderboard and historical state partitioning, unclear support for all required derived views, too dependent on third-party latency/availability.

## ADR
- **Decision:** Use shared server-side WCA domain modules with separate historical-ingest and upcoming-enrichment paths, plus app-native loaders/server functions for public reads.
- **Drivers:** read performance, operational simplicity, fit with current stack.
- **Alternatives considered:** on-demand parsing at request time; thin UI over external endpoints.
- **Why chosen:** V1 needs fast public competitor lookups and a leaderboard; precomputed tables make both simpler and more reliable, while shared domain modules keep ingestion reusable across local/manual and scheduled runs and prevent future-event enrichment failures from corrupting historical coverage.
- **Consequences:** more upfront schema and ingestion work, but much simpler read-side UI, fewer runtime surprises, and a cleaner path to test ingestion without depending on the scheduler first.
- **Follow-ups:** if V1 succeeds, later versions can add non-U.S. support, richer state pages, or personalization without redesigning the core ingest/read split.

## Implementation Steps
### Phase A — Baseline stabilization + historical read-model

### 0. Make schema authority and baseline diagnostics trustworthy
- Fix the local dependency state so `npm run build` and `npm run test` can execute; current failure is due to missing optional Rollup native package.
- Treat `src/db/schema.ts` as the single schema authority because `drizzle.config.ts:4-10` already does; repair or exclude the broken TS artifact at `src/db/supabase/migrations/schema.ts:17-27` so project-wide diagnostics become trustworthy again under `tsconfig.json:1-29`.
- Verify current route generation and DB tooling still work after dependency repair.
- Likely touchpoints: local install state, `package.json`, lockfile only if actually required by reinstall, `src/db/supabase/migrations/schema.ts`, `tsconfig.json` only if the team explicitly chooses exclusion over repair.

### 1. Replace the current region schema with a WCA-coverage-friendly model
- Extend `src/db/schema.ts` from the current `competitors / regions / competitor_regions` baseline into this concrete V1 shape:
  - **keep** `competitors` as the canonical competitor dimension
  - **keep/narrow** `regions` as the canonical U.S. state dimension for V1
  - **keep** `competitor_regions` as the materialized competitor-to-state coverage summary read model
  - **add** `competitions` for historical and upcoming competition metadata
  - **add** `competition_regions` (or equivalent join) to map competitions into canonical states
  - **add** `ingestion_runs` for sync observability and staleness tracking
- Treat `src/db/supabase/migrations/schema.ts` as a stale generated/helper artifact, not a second schema authority: delete or regenerate it after the schema rewrite, and if a helper file must remain generated there later, keep it out of app compilation.
- Keep `src/db/schema.ts` as the authoritative schema source, then generate a new Drizzle migration under `src/db/supabase/migrations/` and ensure it is idempotent for development environments.
- Add any missing env vars to `src/env.ts` if ingestion needs additional credentials or URLs.
- Define explicit canonical U.S. state normalization rules so competition locations map deterministically into the visited/unvisited state model.

### 2. Build shared WCA domain modules and a manual historical ingestion path first
- Add shared server-side WCA domain modules, likely under new paths such as `src/lib/wca/` or `src/server/wca/`, to:
  - fetch/process the weekly WCA export artifact gathered by cron
  - normalize competitors, states, and competition history into Postgres
  - derive `competitor_regions`-style summaries for visited state count and leaderboard ordering
  - record ingestion success/failure metadata
- Expose the same historical-ingestion core through a manual/dev entrypoint first, for example `src/server/wca/run-manual-history-ingest.ts`, which accepts a local file path or remote export URL produced by cron.
- Historical source contract: a weekly WCA export artifact (zip/sql dump or extracted data source) provided either as a local dev fixture or as the cron-produced artifact location.
- Ensure reruns are safe and do not duplicate competition/state coverage rows.

### 3. Create read-side query helpers for the public site
- Add query modules, likely under `src/db/queries/` or `src/lib/wca/queries.ts`, for:
  - competitor lookup by WCA ID
  - visited/unvisited state partitioning
  - state-level last-3 historical competitions
  - unvisited-state upcoming competitions
  - top-100 leaderboard query ordered by `visited_state_count DESC, wca_id ASC`
- Keep public read logic independent from auth because V1 is public-only.
- Prefer server functions / route loaders for the first version rather than reviving the demo oRPC todo surface; shared WCA modules should stay transport-agnostic so a future API layer can wrap them if needed.

### 4. Replace starter UI with product routes
- Replace `src/routes/index.tsx` starter marketing UI with the actual homepage/search entrypoint.
- Replace the placeholder shell in `src/routes/__root.tsx` with real navigation and app metadata for the WCA site.
- Add route files for the core product views, likely:
  - `src/routes/leaderboard.tsx`
  - `src/routes/person.$wcaId.tsx` or similar competitor-detail route
- Remove or de-emphasize starter/demo navigation directly in `src/routes/__root.tsx`; only refactor `src/components/Header.tsx` / `src/components/Footer.tsx` if they are intentionally adopted into the final shell.

### 5. Implement server-side data loading in route-native patterns
- Use TanStack Start route loaders and/or `createServerFn`, following the transport shape shown in `src/routes/demo/drizzle.tsx:1-27`, to fetch competitor and leaderboard data from Postgres; do not treat that demo route as a trustworthy schema/query example because it still references `todos`.
- Return structured UI states for:
  - valid WCA ID
  - unknown WCA ID
  - state with no upcoming competitions
  - temporarily stale data / last updated timestamp
  - upcoming-competition source unavailable, while still rendering historical coverage successfully
- Keep the public UI simple and informational; do not add filters, saved states, or travel-planning logic.

### Phase B — Scheduler + upcoming competition enrichment

### 6. Add scheduled historical execution
- Add a Worker entry wrapper, for example `src/entry.worker.ts`, that delegates HTTP fetch handling to the TanStack Start server entry and owns the Cloudflare `scheduled()` export.
- The `scheduled()` handler should call a dedicated historical-ingest function such as `runScheduledHistoryIngest()` from `src/server/wca/scheduled-history.ts`.
- Add the corresponding scheduled configuration in `wrangler.jsonc` only after the manual ingestion path is proven locally.
- Reuse the shared historical-ingestion/domain modules from step 2 instead of duplicating logic in the scheduler.

### 7. Add separate upcoming competition enrichment
- Upcoming source contract: fetch future U.S. competitions from a WCA competitions endpoint/feed into a separate upcoming-events table with its own `updated_at` / staleness timestamp.
- Own this path in a dedicated module such as `src/server/wca/upcoming-enrichment.ts`; it may be called from the same `scheduled()` wrapper, but it must remain logically separate from historical ingestion.
- Reuse shared normalization code, but keep future-event fetch failures soft-fail only so historical coverage and leaderboard reads continue to work.
- Degrade gracefully when the future-competition source is unavailable or incomplete.

### 8. Add focused tests around derivation and route behavior
- Add unit/integration coverage for the ingest and query layers.
- Add route-level tests for the homepage search, competitor detail rendering, and leaderboard rendering.
- Seed representative fixtures for:
  - a competitor with multiple visited states
  - a competitor with zero U.S. states
  - ties on the leaderboard
  - states with fewer than 3 historical competitions
  - states with and without upcoming competitions
  - state/location normalization edge cases
  - unavailable upcoming-competition source responses

### 9. Finalize deployment and operations docs
- Document required env vars, ingestion workflow, and recovery steps in `README.md` or a dedicated ops doc.
- Add notes for manually rerunning ingestion and inspecting failures.
- Verify the deployed app and scheduled sync path together before calling V1 complete.

## Risks and Mitigations
- **Risk:** upcoming competitions may not be reliably derivable from the weekly results export alone.  
  **Mitigation:** explicitly model upcoming-competition ingestion as a separate scheduled fetch using a WCA competitions endpoint or equivalent feed.
- **Risk:** external WCA endpoint contracts, availability, or rate limits may drift independently of the export pipeline.  
  **Mitigation:** isolate external fetches behind a small adapter module, log fetch failures separately from export ingestion, and degrade upcoming-competition display gracefully without blocking historical coverage pages.
- **Risk:** current schema is too narrow for competition history + future listings.  
  **Mitigation:** normalize around competitions + state summaries rather than overloading only `competitor_regions`.
- **Risk:** starter/demo UI and demo APIs create confusion during implementation.  
  **Mitigation:** replace homepage/root-shell early and treat demo todo/oRPC surfaces as disposable.
- **Risk:** Cloudflare scheduled execution will not share request-time loader/server-function context.  
  **Mitigation:** keep ingestion logic in shared server-side modules that are callable from both a manual runner and the scheduler, and use loaders/server functions only for read-side HTTP access.
- **Risk:** generated migration-side TS artifacts can drift from the authoritative schema and break project diagnostics.  
  **Mitigation:** keep `src/db/schema.ts` as the single schema source of truth and either repair, delete, or exclude broken generated/helper TS artifacts before further migration work.
- **Risk:** state/location data may not map cleanly to canonical U.S. states.  
  **Mitigation:** create and test an explicit state-normalization layer before deriving coverage summaries.
- **Risk:** baseline local verification is currently broken by dependency state.  
  **Mitigation:** make dependency repair step zero and do not trust later failures until the toolchain is clean.
- **Risk:** scheduled sync failures could leave stale public data with no visibility.  
  **Mitigation:** persist ingestion-run metadata and surface `last updated` timestamps.
- **Risk:** coupling parsing logic directly to route loaders would make scheduled/manual sync paths diverge over time.  
  **Mitigation:** centralize parsing and query derivation in shared server-side WCA domain modules, then call them from both scheduled and request-time entrypoints.

## Verification Steps
1. **Install-state remediation:** run `pnpm install` first; only change `package.json` or lockfiles if a clean reinstall still reproduces the missing Rollup native package. Proof: `npm run build` no longer fails with `@rollup/rollup-linux-x64-gnu` missing.
2. **Baseline checks:** run `npm run build` and `npm run test`. Proof: both commands complete without the current Rollup optional-dependency failure.
3. **Schema/migration generation:** run `npm run db:generate` after the schema rewrite, then `npm run db:push` (or the chosen local apply command). Proof: migrations generate/apply cleanly from `src/db/schema.ts` without `src/db/supabase/migrations/schema.ts` syntax fallout.
4. **Manual historical ingest:** run the planned manual entrypoint, e.g. `pnpm tsx src/server/wca/run-manual-history-ingest.ts --source ./fixtures/wca-export.zip`. Proof: rows populate `competitors`, `regions`, `competitions`, `competition_regions`, `competitor_regions`, and `ingestion_runs` as expected.
5. **Ranking contract:** add a fixture-backed test proving leaderboard ordering is exactly `visited_state_count DESC, wca_id ASC`.
6. **State normalization:** add a fixture-backed test proving state/location normalization maps source locations into canonical U.S. states before coverage summaries are derived.
7. **Route/UI flow:** run `npm run build` (or the route-generation step used by the repo) after adding routes, then verify `src/routeTree.gen.ts` contains the new product routes and manually test homepage search -> competitor detail -> leaderboard flow.
8. **Upcoming enrichment soft-fail:** run the upcoming enrichment path with an unavailable or empty future-events source. Proof: historical competitor pages and leaderboard reads still succeed while upcoming sections show a graceful stale/empty state.
9. **Scheduled ownership:** deploy or locally emulate the Worker wrapper and verify its `scheduled()` handler calls the same historical-ingestion code path used by the manual entrypoint.

## Available-Agent-Types Roster
- `architect` — system design, boundaries, shared-domain-module decisions, tradeoffs
- `executor` — implementation of data model, ingestion, routes, and refactors
- `debugger` — ingestion/runtime failure diagnosis
- `test-engineer` — fixture design and coverage strategy
- `verifier` — completion evidence and release readiness
- `dependency-expert` — external WCA API/export evaluation if integration details drift
- `writer` — docs and runbook updates

## Follow-up Staffing Guidance
### If using `$ralph`
- **Lane 1 — schema + ingestion core:** `executor` (high)
- **Lane 2 — public routes + loaders:** `executor` (medium/high)
- **Lane 3 — tests + fixtures:** `test-engineer` (medium)
- **Lane 4 — final validation:** `verifier` (high)
- Pull in `dependency-expert` only if WCA export/upcoming endpoint details are unclear during implementation.

### If using `$team`
Recommended staffing:
- 1 `architect` lead lane for schema/query boundary review
- 2 `executor` lanes:
  - data/ingestion lane
  - UI/routes lane
- 1 `test-engineer` lane for fixture-backed verification
- 1 `verifier` lane for final evidence pass
Suggested reasoning:
- architect: high
- ingestion executor: high
- UI executor: medium/high
- test-engineer: medium
- verifier: high

## Launch Hints
### Ralph path
- `$ralph .omx/plans/ralplan-wca-us-state-coverage-site.md`

### Team path
- `$team .omx/plans/ralplan-wca-us-state-coverage-site.md`
- Or equivalent `omx team` launch using separate data, UI, test, and verification lanes grounded in this plan.

## Team Verification Path
Before shutdown, the team should prove:
1. schema + migrations apply cleanly
2. ingestion can populate historical state coverage and upcoming competitions
3. homepage search, competitor detail, and leaderboard routes render expected data
4. automated tests cover derivation and route behavior
5. deployment config includes the scheduled ingestion path

After team execution, a Ralph/verifier pass should confirm final acceptance criteria against this plan and record any residual gaps.

## Changelog
- Initial consensus draft created from the approved deep-interview spec and current repo inspection.
- Revised the chosen architecture to emphasize shared WCA domain modules reused by both manual and scheduled ingestion paths.
- Applied architect review feedback to split authoritative historical ingestion from soft-fail upcoming enrichment, and to make `src/db/schema.ts` the explicit schema authority in the plan.
- Applied critic review feedback to specify surviving/replaced tables, define the exact leaderboard tie-break rule, and assign concrete ownership to manual and scheduled ingestion entrypoints.
- Added repo-specific cleanup risks for the broken duplicate migration schema and the fact that `__root.tsx`, not `src/components/Header.tsx`, currently owns the active app shell.
- Added a separate risk for upcoming competition sourcing because public WCA docs indicate competitions are queryable via API endpoints and future-event availability should not be assumed from weekly results exports alone.
- Split the implementation into a baseline/manual-ingest phase and a later scheduler/enrichment phase, and added normalization plus degraded-upcoming-source verification requirements.
