# TODOs
- nicer team vanity urls
- team management (partial: Edit Pods add player + batch type edit; still no full roster CRUD UI)
- tournament management
- stat track using existing game
- bigger buttons (better UX)

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

Stay on Pages Router unless there is a concrete win. Next 16 still supports `pages/` + `pages/api`; migration is a large refactor (`use client`, route moves, caching model), not required for current features.

**Potential wins:** nested `layout.tsx` (team → game → point), server-rendered read-only pages (e.g. completed **summary** instead of client `fetch`), streaming/`loading.tsx`, colocation with Server Components, better alignment with Next docs long-term.

**Low value here:** live line/point tracking stays client-heavy anyway; existing API routes are fine; complexity goes up for operators who need simple, fast UI.

**If migrating:** slice, don’t big-bang — e.g. summary (read-only) first; keep game/point flows on Pages or client islands until stable.

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
