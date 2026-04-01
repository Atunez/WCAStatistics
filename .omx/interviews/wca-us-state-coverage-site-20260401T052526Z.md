# Deep Interview Transcript Summary

- **Task:** WCA U.S. state coverage website using weekly WCA export ingestion
- **Profile:** standard
- **Context type:** brownfield
- **Final ambiguity:** 0.189
- **Threshold:** 0.20
- **Context snapshot:** `.omx/context/wca-us-state-coverage-site-20260401T051752Z.md`

## Key conclusions
- Core purpose: help WCA competitors see which U.S. states they have already competed in and discover upcoming competitions in states they have not yet done.
- V1 is U.S.-only.
- A state counts as "done" if the competitor has at least one official WCA competition result in that U.S. state from the ingested export data.
- Upcoming competition display is informational only: basic competition name, date, city, and WCA link.
- V1 should include a public leaderboard with a fixed default of top 100 competitors by U.S. states visited.

## Non-goals
- No user accounts
- No map visualizations
- No non-U.S. regions
- No advanced filters
- No manual data correction/admin workflows
- No travel-planning features beyond basic upcoming competition listings

## Acceptance bar
V1 is good enough to ship when:
- searching a valid WCA ID works
- the page shows visited state count
- it shows visited vs unvisited U.S. states
- each state shows the last 3 competitions
- unvisited states can show next upcoming competitions with basic info
- a public leaderboard shows top competitors by states visited

## Round-by-round condensed transcript
1. **Intent** — Q: If V1 could do only one thing well, what is it?  
   **A:** allow users to see their states, and possible comps they can go to at other states
2. **Intent** — Q: What problem with the current WCA experience are you fixing?  
   **A:** that is the issue
3. **Outcome** — Q: Give one concrete ideal V1 user story.  
   **A:** a competitor enters their ID and sees the states they have done, and notices the places they haven't competed in, and are able to check the comps in those areas
4. **Non-goals** — Q: What should explicitly not be in V1?  
   **A:** we should avoid user accounts, maps visulizations, non-us regions, filters, manual data, and travel planning
5. **Decision boundary / pressure pass** — Q: Should upcoming comp data be minimal informational listing only?  
   **A:** yes
6. **Constraint** — Q: Should a state count as done if the competitor has any official WCA result there in the weekly export?  
   **A:** yes
7. **Success criteria** — Q: Is the listed V1 ship bar correct?  
   **A:** that is the right bar
8. **Constraint** — Q: Should leaderboard default to top 100, with ties broken by implementation choice?  
   **A:** yes

## Pressure-pass finding
A prior answer about showing future competitions was revisited to force a boundary between "upcoming comps" and "travel planning." The clarified boundary is that V1 may list minimal upcoming comp info per unvisited state, but must not include planning features.
