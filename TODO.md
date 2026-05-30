# Out of scope (unless explicitly requested)

These items were considered for the agentic-dev setup and intentionally deferred:

- **App Router migration** — stay on Pages Router
- **Drizzle Kit push/generate** — schema changes use hand-written SQL migrations + Drizzle schema sync
- **Broad API error-handler refactor** — match existing per-route style unless fixing a specific route
- **Full-page snapshot suites** — prefer unit tests on `src/utils.ts` and small component behavior tests
- **Auth / multi-tenancy** — single-operator app today; no login layer

Optional later (see plan):

- GitHub Actions CI (`lint`, `test:run`, `build`)
- Playwright E2E (full browser + Postgres flows)
- MSW-backed page tests
