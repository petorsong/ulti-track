# AGENTS.md — development guide

Canonical instructions for **any** coding agent or assistant (Cursor, GitHub Copilot, Claude Code, Codex, etc.). No IDE-specific rule files are required — read this file at the start of a task.

- Product overview and setup: [README.md](README.md)
- Deferred / out-of-scope work: [TODO.md](TODO.md)
- Human-oriented contributing pointer: [CONTRIBUTING.md](CONTRIBUTING.md)

## Verify before finishing

```bash
npm install
npm run migrate          # requires .env (copy from .env.example)
npm run lint
npm run test:run
npm run typecheck
npm run build
```

`npm run build` does not need a running database. Tests do not need Postgres.

## Repository layout

| Area | Path |
|------|------|
| Drizzle schema | `src/database/schema.ts` |
| SQL migrations | `src/database/migrations/*.sql` |
| Migration runner | `scripts/migrate.js` (do not edit for schema changes) |
| API routes | `src/pages/api/` (one file ≈ one route) |
| Pages | `src/pages/` |
| Components | `src/components/` |
| Game rules (O/D, field side, mixed caps) | `src/utils.ts` — `calculatePointInfo`, `splitPlayers` |
| Post-game stats | `src/pages/api/games/[gameId]/summary.ts` |
| Tests | `src/**/*.test.ts(x)`, `src/test/` helpers |

Path alias: `@/*` → `src/*`. In tests and TS, `@mui/material` resolves to **Joy UI** (`@mui/joy`) per `tsconfig.json`.

## Where to look (by task)

| If you are changing… | Primary paths | Section below |
|---------------------|---------------|---------------|
| Database schema / SQL | `src/database/**` | [Migrations](#migrations) |
| HTTP API | `src/pages/api/**` | [API routes](#api-routes) |
| Game flow / lineup / live point UI | `src/utils.ts`, `src/pages/games/**`, `src/pages/points/**` | [Game domain](#game-domain) |
| Tests | `**/*.test.ts`, `**/*.test.tsx` | [Testing](#testing) |
| Shared UI components | `src/components/**` | [Testing](#testing), match neighboring components |

## Local dev entry

After `cp .env.example .env`, `npm run migrate`, and `npm run dev`:

- **Test team:** http://localhost:3000/test (seeded Test Team)
- Other shortcuts: `redirects` in `next.config.ts` (`/devs2026`, etc.)

Root `/` is the default Next.js splash — not the app home.

## Migrations

Applies when editing `src/database/**`.

- Schema types/tables: `src/database/schema.ts` (Drizzle).
- Apply DDL with a **new** `.sql` file: `npm run generate <short_name>` → edit under `src/database/migrations/`.
- Run `npm run migrate` to apply.
- Never edit migrations already applied in shared environments.
- `scripts/migrate.js` is the runner only — no schema DDL there.
- Do not use Drizzle Kit push/generate unless explicitly requested.

## API routes

Applies when editing `src/pages/api/**`.

- Pages Router: default export `handler(req, res)` with `NextApiRequest` / `NextApiResponse`.
- DB: `db` from `@/database/drizzle`; types from `@/database/schema`.
- POST bodies: often `JSON.parse(req.body)` — match the route you are editing.
- Multi-step writes: `db.transaction(async (tx) => { ... })`.
- Errors: only some routes return `ApiError` from `@/types`; no global error wrapper unless asked.

## Game domain

Applies when editing game/point logic or pages.

- Pull, offence/defence, field side, halftime, mixed caps: `calculatePointInfo` in `src/utils.ts`.
- Lineup columns: `splitPlayers` (Mixed / Open / Women differ).
- Lines are **7 players** (`points.playerIds` length 7).
- Event types: `EventType` in `src/database/schema.ts` (`SCORE`, `PASS`, `BLOCK`, `TA`, `DROP`, etc.).
- Rule changes require updates to `src/utils.test.ts`.

## Testing

Applies when adding or changing tests.

- Runner: Vitest — `npm test` (watch) or `npm run test:run` (CI-style).
- Components: `@testing-library/react` + jsdom; assert roles, labels, clicks — not full MUI trees.
- Prefer unit tests on `src/utils.ts` over large page snapshots.
- Pages: mock `next/router` via `src/test/mocks/next-router.ts`.
- Review snapshot diffs intentionally; do not bulk-update without cause.

## General conventions

- **No auth** — do not add login or multi-tenant unless asked.
- **Scope** — minimal diffs; do not refactor unrelated files.
- **Docker Compose** — Postgres only; schema via `npm run migrate`, not Compose init.

## Do not

- Rely on Docker Compose to apply schema.
- Change `/` splash or add auth without an explicit request.
- Use Drizzle Kit push as a substitute for SQL migrations.
