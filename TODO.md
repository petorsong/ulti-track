# TODOs
- nicer team vanity urls
- team management (partial: Edit Pods add player + batch type edit; still no full roster CRUD UI)
- tournament management
- stat track using existing game
- bigger buttons (better UX)
- consider Firebase migration — evaluate costs compared to Netlify
- Lambda for post-game processing

## Offline draft follow-ups

Shipped: live games use client-side drafts (`/teams/[teamId]/live/*`) in `localStorage`, roster cache for offline game start, Edit Pods roster changes (pod moves, add player, batch type edit) synced on Save (`POST /api/teams/[teamId]/roster/sync`), game stats bulk sync on completion (`POST /api/teams/[teamId]/game/complete`), mid-point substitutions (same-gender, `SUBSTITUTION` events, disc handoff). Legacy `/games/[gameId]` and `/points/[pointId]` redirect or stall.

- update `README.md` user flows — still describes old `/games/[gameId]` and `/points/[pointId]` paths; document `/teams/[teamId]/live/*` offline draft + sync
- hybrid browser back (`popstate`) on live pages
- multi-tab `storage` event warning when another tab edits the same draft
- incompatible `schemaVersion` dialog on team page (`useDraftGame` already exposes `loadStatus`)

**Decided:** pod editing only between games — disabled during active draft, with popup explaining why.

## Dependency updates

**Safe minor bumps (run verify loop after):** `react` / `react-dom` 19.1 → 19.2.x, `@types/react`, `pg`, `prettier`; check `drizzle-orm` release notes when convenient.

**Blocked / needs a dedicated pass:** `eslint-config-next` 16 to match Next 16 — breaks current `FlatCompat` + `eslint.config.mjs` (circular JSON); migrate to Next flat ESLint config first.

**Defer majors unless migrating:** `eslint` 10, `typescript` 6, `vitest` 4, `@types/node` 25, `antd` 6, MUI 9 (`@mui/material` / icons; app UI is Joy beta). `@mui/joy` still on 5.0 beta — revisit when stable.

**Note:** Joy + antd Table only on summary; `eslint .` must ignore `.next/` (see `eslint.config.mjs`).

## App Router (Pages Router today)

**Re-evaluated (post offline draft):** still defer. Offline work moved the hot path to client-only `localStorage` drafts under `/teams/[teamId]/live/*`; that strengthens the “client island” model rather than creating new SSR wins.

**Verdict:** stay on Pages Router unless a concrete slice (summary SSR) is worth the churn.

**What offline changed**

- **Live flow is fully client-side** — `useDraftGame`, roster cache, bulk sync on complete (`POST …/game/complete`). App Router Server Components / RSC do not help lineup, point, or undo; those routes would be `'use client'` end-to-end, same as today.
- **Clearer route tree** — team hub → `live` → `live/point` → `live/complete` maps to nested `layout.tsx`, but the win is mostly DRYing shared hydration guards, redirect-on-phase, and persist-error UI. Same can be done on Pages Router with a shared layout component — no migration required.
- **Legacy online tracker de-emphasized** — `/games/[gameId]` and `/points/[pointId]` redirect or stall; less pressure to migrate old per-point API-driven pages. A future App Router pass can ignore legacy routes or leave them on `pages/`.
- **Migration cost rose slightly** — more live sub-routes, phase redirects, and localStorage schema versioning to preserve; all client-hydration sensitive.

**Unchanged wins (still valid)**

- **Summary** (`/games/[gameId]/summary`) — read-only, client `fetch` today; best first slice for server-rendered stats if we migrate at all.
- **Team page games list** — could SSR team metadata + past games; secondary to offline roster cache on first load.
- **`pages/api`** — coexists with App Router; bulk sync and roster endpoints need no route-tree move.

**Still low value**

- Server rendering / streaming on live tracking — operators need instant local state, not SSR.
- Full big-bang migration — live subtree + Joy UI + antd summary table + existing API style = large refactor for little UX gain on the path people actually use.

**If migrating:** slice, don’t big-bang — summary first; live subtree as a single client layout (App or Pages); keep `pages/api` until/unless moving to Route Handlers deliberately.

**Before any App Router work:** fix `eslint-config-next` 16 / flat ESLint (see Dependency updates).

# Out of scope (unless explicitly requested)

These items were considered for the agentic-dev setup and intentionally deferred:

- **App Router migration** — see section above; default stay on Pages Router
- **Drizzle Kit push/generate** — schema changes use hand-written SQL migrations + Drizzle schema sync
- **Broad API error-handler refactor** — match existing per-route style unless fixing a specific route
- **Full-page snapshot suites** — prefer unit tests on `src/utils.ts` and small component behavior tests
- **Auth / multi-tenancy** — single-operator app today; no login layer

Optional later:

- Playwright E2E (full browser + Postgres flows)
- MSW-backed page tests
