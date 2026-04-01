# PRD — WCA U.S. State Coverage Site

## Problem
WCA competitors cannot easily tell which U.S. states they have already competed in, nor quickly discover upcoming competitions in states they have not yet done.

## Goal
Create a public U.S.-only website that lets a user search by WCA ID, see visited vs unvisited states, review recent competition history per state, and discover basic upcoming competition listings in unvisited states.

## Users
- Primary: WCA competitors checking their U.S. state coverage
- Secondary: users browsing the leaderboard of competitors with the most U.S. states visited

## V1 scope
- Public homepage with WCA ID search
- Competitor detail view with:
  - visited state count
  - visited states
  - unvisited states
  - last 3 competitions per state
  - upcoming competitions for unvisited states when available
- Public leaderboard showing top 100 competitors by U.S. states visited
- Scheduled ingestion of WCA export data gathered by cron

## Non-goals
- Accounts / saved profiles
- Maps
- Non-U.S. regions
- Advanced filters
- Manual data correction workflows
- Travel planning beyond basic upcoming competition listings

## Core rules
- A state counts as visited if the competitor has at least one official WCA result in that U.S. state from ingested export data.
- Upcoming competition data is informational only.
- Leaderboard default is fixed to top 100 competitors.

## Data assumptions
- Historical competitor/state coverage comes from the weekly WCA export ingestion pipeline.
- Upcoming competitions should be sourced from a WCA competitions endpoint or equivalent scheduled fetch, because future-competition availability in the weekly results export is not guaranteed enough for V1 planning.
- If the upcoming-competition source is unavailable, the product should still render historical state coverage and show that future competitions are temporarily unavailable.

## Success criteria
- Valid WCA ID lookup works.
- Competitor page shows visited state total and visited/unvisited breakdown.
- Each state can show the last 3 competitions.
- Unvisited states can show next upcoming competitions when present.
- Leaderboard shows the top 100 competitors by visited U.S. states.
