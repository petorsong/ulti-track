# Agent guide — ulti-track

Human-oriented overview: [README.md](README.md). Deferred work: [TODO.md](TODO.md).

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

Path alias: `@/*` → `src/*`. In tests and TS, `@mui/material` resolves to **Joy UI** (`@mui/joy`) per `tsconfig.json`.

## Schema changes

1. Update `src/database/schema.ts` (Drizzle types/tables).
2. Create SQL: `npm run generate <short_name>` → edit the new file under `src/database/migrations/`.
3. Run `npm run migrate`.

Never edit migrations that have already been applied in shared environments.

## Local dev entry

After migrate and `npm run dev`:

- **Test team:** http://localhost:3000/test (redirects to seeded Test Team)
- Other shortcuts: see `redirects` in `next.config.ts` (`/devs2026`, etc.)

Root `/` is still the default Next.js splash — not the app home.

## Conventions

- **No auth** — do not add login/multi-tenant unless asked.
- **API bodies** — many routes use `JSON.parse(req.body)` on POST; follow neighboring handlers.
- **Transactions** — multi-step writes use `db.transaction` (see existing game/point routes).
- **Scope** — minimal diffs; do not refactor unrelated files.

## Testing

- Game-rule changes → update `src/utils.test.ts`.
- UI component changes → update or add `*.test.tsx` next to the component.
- Prefer Testing Library behavior assertions over large snapshots.
- Do not update snapshots without reviewing the diff.

## Do not

- Rely on Docker Compose to apply schema (use `npm run migrate`).
- Change `/` splash or add auth without an explicit request.
- Use Drizzle Kit push as a substitute for SQL migrations.
