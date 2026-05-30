# TODOs
- nicer team vanity urls
- team management
- tournament management
- offline
- stat track using existing game
- bigger buttons (better UX)

## Dependency updates

**Safe minor bumps (run verify loop after):** `react` / `react-dom` 19.1 → 19.2.x, `@types/react`, `pg`, `prettier`; check `drizzle-orm` release notes when convenient.

**Blocked / needs a dedicated pass:** `eslint-config-next` 16 to match Next 16 — breaks current `FlatCompat` + `eslint.config.mjs` (circular JSON); migrate to Next flat ESLint config first.

**Defer majors unless migrating:** `eslint` 10, `typescript` 6, `vitest` 4, `@types/node` 25, `antd` 6, MUI 9 (`@mui/material` / icons; app UI is Joy beta). `@mui/joy` still on 5.0 beta — revisit when stable.

**Note:** Joy + antd Table only on summary; `eslint .` must ignore `.next/` (see `eslint.config.mjs`).

# Out of scope (unless explicitly requested)

These items were considered for the agentic-dev setup and intentionally deferred:

- **App Router migration** — stay on Pages Router
- **Drizzle Kit push/generate** — schema changes use hand-written SQL migrations + Drizzle schema sync
- **Broad API error-handler refactor** — match existing per-route style unless fixing a specific route
- **Full-page snapshot suites** — prefer unit tests on `src/utils.ts` and small component behavior tests
- **Auth / multi-tenancy** — single-operator app today; no login layer

Optional later:

- Playwright E2E (full browser + Postgres flows)
- MSW-backed page tests
