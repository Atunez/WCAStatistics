# Deep Interview Spec — WCA U.S. State Coverage Site

## Metadata
- **Profile:** standard
- **Rounds:** 8
- **Final ambiguity:** 0.189
- **Threshold:** 0.20
- **Context type:** brownfield
- **Context snapshot:** `.omx/context/wca-us-state-coverage-site-20260401T051752Z.md`
- **Transcript summary:** generated alongside this spec under `.omx/interviews/`

## Clarity breakdown
| Dimension | Score |
|---|---:|
| Intent | 0.80 |
| Outcome | 0.82 |
| Scope | 0.84 |
| Constraints | 0.82 |
| Success criteria | 0.82 |
| Brownfield context | 0.78 |

## Intent
Build a public website that solves a specific gap in the current WCA experience: competitors cannot easily tell which U.S. states they have already competed in, and they also lack a simple way to see upcoming competitions in states they have not yet done.

## Desired outcome
A user can enter a WCA ID and immediately understand:
- how many U.S. states they have competed in
- which U.S. states they have already done
- which U.S. states they have not done
- what the recent competition history looks like in each state
- what upcoming competitions exist in unvisited states, using a basic informational listing

The site also exposes a public leaderboard showing the top competitors by number of U.S. states visited.

## In scope
- scheduled ingestion of WCA weekly results export data gathered by cron
- deriving U.S. state visit coverage per competitor from official results
- WCA ID search / lookup flow
- per-competitor page or view showing:
  - visited state count
  - visited vs unvisited U.S. states
  - per-state recent competition history (last 3 competitions)
  - for unvisited states, next upcoming competitions if present
- leaderboard page/view with a fixed default of top 100 competitors by U.S. states visited
- basic upcoming competition display limited to simple informational fields such as competition name, date, city, and WCA link

## Out of scope / non-goals
- user accounts or saved profiles
- map visualizations
- support for non-U.S. regions in V1
- advanced filters
- manual data correction or admin editing workflows
- travel-planning features beyond showing basic upcoming competition info

## Decision boundaries
OMX may decide without further confirmation:
- route structure and page layout
- database normalization and schema details
- API shape and server-function organization
- caching and refresh strategy
- tie-break strategy for leaderboard ordering when state counts are equal
- exact visual presentation, as long as it preserves the above scope and non-goals

OMX should not change without explicit confirmation:
- the core V1 product goal (personal state coverage + simple next-state discovery)
- U.S.-only scope for V1
- the rule that a state counts as visited only from official WCA result presence in export data
- the exclusion of accounts, maps, filters, manual edits, and travel-planning features

## Constraints
- A U.S. state counts as "done" when the competitor has at least one official WCA competition result in that state from the ingested export data.
- V1 should remain public and lightweight; no authentication is required.
- Upcoming competition information is informational only, not a planning tool.
- Data source is the WCA weekly export ingestion pipeline, gathered on a schedule via cron.

## Testable acceptance criteria
1. A valid WCA ID can be searched successfully.
2. The resulting competitor view shows the total number of visited U.S. states.
3. The competitor view clearly separates visited and unvisited U.S. states.
4. Each state entry shows the last 3 competitions for that state.
5. Unvisited states show next upcoming competitions when such competitions exist.
6. Upcoming competition listings are limited to basic info (name, date, city, WCA link or equivalent minimal details).
7. A public leaderboard shows the top competitors ranked by U.S. states visited.
8. Leaderboard default is fixed to top 100 competitors.

## Assumptions exposed + resolutions
- **Assumption:** the main user value might be leaderboard entertainment.  
  **Resolution:** rejected as the primary V1 goal; the main value is personal coverage lookup plus simple discovery of unvisited-state competitions.
- **Assumption:** showing upcoming competitions might imply broader travel-planning features.  
  **Resolution:** narrowed to a minimal informational listing only.
- **Assumption:** "done" might require more than attendance/result presence.  
  **Resolution:** defined as any official WCA result in that state from the export data.

## Pressure-pass findings
The earlier desire to show future competitions was revisited and narrowed. The clarified V1 boundary is: show only minimal upcoming comp metadata for unvisited states; do not expand into travel recommendations, itineraries, distance logic, or other planning features.

## Brownfield evidence vs inference
### Evidence from repository
- `package.json` indicates TanStack Start + React + Mantine + Drizzle + PostgreSQL + Wrangler/Cloudflare.
- `src/db/schema.ts` already contains `competitors`, `regions`, and `competitor_regions` tables.
- `src/routes/index.tsx` is still template content.
- `src/routes/__root.tsx` includes a placeholder `Region Tracker` UI element.

### Inference
- Existing region-oriented schema suggests the repo was already moving toward a coverage-tracking concept.
- Current product surface is still mostly scaffold-level, so implementing this will likely require replacing starter UI and extending the data model / ingestion layer.

## Technical context findings
Likely touchpoints include:
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- new route files under `src/routes/`
- `src/db/schema.ts` and migrations
- server/API routes under `src/routes/api*`
- scheduled ingestion/deployment configuration

## Recommended handoff
Recommended next step: **`$ralplan`** using this spec as the requirements source of truth, followed by execution.
