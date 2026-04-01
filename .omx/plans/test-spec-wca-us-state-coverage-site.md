# Test Spec — WCA U.S. State Coverage Site

## Acceptance tests
1. **WCA ID lookup**
   - Given a valid WCA ID in the database, requesting the competitor page returns a 200 response and the competitor name/WCA ID.
   - Given an unknown WCA ID, the UI shows a clear not-found state.

2. **Visited state total**
   - The competitor page returns the correct number of visited U.S. states based on official-result-derived state coverage.

3. **Visited vs unvisited partition**
   - Every U.S. state appears in exactly one bucket for a competitor: visited or unvisited.
   - No non-U.S. region appears in V1 output.

4. **Last 3 competitions per state**
   - For a state with 3+ competitions, exactly 3 most recent historical competitions are returned in descending date order.
   - For a state with fewer than 3 competitions, all available competitions are returned.

5. **Upcoming competitions**
   - Unvisited states with upcoming competitions show basic info only: name, date, city, and WCA link.
   - States without upcoming competitions show an empty state, not an error.
   - If the upcoming-competition source is unavailable, the historical state view still renders and upcoming data shows a degraded-but-clear unavailable state.

6. **Leaderboard**
   - The leaderboard returns at most 100 competitors.
   - Ordering is descending by visited U.S. states.
   - Tie-break behavior is deterministic.

7. **Scheduled ingestion**
   - Running the ingestion job updates historical state coverage data idempotently.
   - A failed ingestion run records failure metadata without corrupting the last successful snapshot.

8. **State normalization**
   - Competition location data maps deterministically into canonical U.S. state identities.
   - Known normalization edge cases are covered by fixtures/tests.

## Verification layers
- Unit: state coverage derivation, leaderboard ordering, state partitioning, competition grouping
- Integration: DB-backed loaders/server functions and ingestion pipeline
- Route/UI: homepage search flow, competitor page states, leaderboard rendering
- Operational: scheduled job invocation, logging, re-run idempotency
- Data quality: state normalization and degraded upcoming-source behavior
