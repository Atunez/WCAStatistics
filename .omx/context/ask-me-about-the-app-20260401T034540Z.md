# Deep Interview Context Snapshot

- **Task statement:** Ask the user about the app to clarify what this repository should become.
- **Desired outcome:** Produce an execution-ready spec for the app's actual purpose, scope, non-goals, and decision boundaries.
- **Stated solution:** Deep interview / app discovery conversation.
- **Probable intent hypothesis:** The user wants to turn this starter/demo-heavy TanStack Start repository into a real WCA statistics product and wants requirements clarified before planning or implementation.

## Known facts / evidence
- Repository is an existing brownfield TanStack Start app (`package.json`, `README.md`).
- Current user-facing routes include `/` and `/about`, both still starter/template content (`src/routes/index.tsx`, `src/routes/about.tsx`).
- Root shell header contains a `Region Tracker` button, suggesting an intended domain direction (`src/routes/__root.tsx`).
- Demo routes exist for Better Auth, Drizzle todos, Sentry testing, table filtering, and oRPC/OpenAPI endpoints (`src/routes/demo/*`, `src/routes/api.$.ts`, `src/routes/api.rpc.$.ts`).
- Dependencies indicate auth, database, RPC, monitoring, Mantine, TanStack Query/Router/Table, and PostgreSQL support.

## Constraints
- No implementation should happen during deep-interview mode.
- Interview should ask one question per round.
- Need explicit non-goals and decision boundaries before crystallizing.

## Unknowns / open questions
- What problem the app should solve for users.
- Who the target users are.
- Whether `Region Tracker` is the real product direction or leftover experimentation.
- Which current demo capabilities should survive vs be discarded.
- Success criteria for the first meaningful version.
- Product boundaries and what OMX may decide autonomously.

## Decision-boundary unknowns
- Can OMX decide UI library patterns, data model details, and route structure without confirmation?
- Which product/content decisions require explicit approval?

## Likely codebase touchpoints
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/routes/about.tsx`
- `src/routes/demo/*`
- `src/orpc/*`
- `src/db/*`
- `src/lib/auth*`
