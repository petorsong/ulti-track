# ulti-track

Web app for **live-tracking ultimate frisbee games**: rosters, lines, possessions, turnovers, timeouts, halftime, mixed gender ratios, and post-game stats. Built for club-style teams that want a structured record without paper.

---

## Major functionality

### Data model

| Area | What it stores |
| --- | --- |
| **Teams** | Name and division type: Mixed, Open, or Women (`src/database/schema.ts`). |
| **Team groups** | Named subsets of a roster (e.g. O-line/D-line buckets). Players belong to exactly one group; one group per team can be marked default; groups can be toggled active. |
| **Players** | Names, nickname, handler/cutter/hybrid role, mixed-gender (**FMP**) and pulling (**PR**) flags, optional sort order — used when splitting players on the lineup UI. |
| **Games** | Opponent label, scores, offence/defence flip rules, starting side (“left”), mixed starting ratio (**F:M** sequencing), halftime marker, timeouts (per-half JSON), roster slice actually playing (`active_player_ids`). |
| **Points** | Seven players on the line for that point; tracks whether the point is still in progress (`is_active`). |
| **Point events** | Typed log: opponent score (`VS_SCORE`), our score (`SCORE`), blocks, turnovers (`TA`/`DROP`), passes (with assists / hockey assists / hucks in JSON), Callahan, subs, timeouts. |

Business rules for **which side pulls, offense vs defence, and mixed ratios** align with alternating patterns (including AB-style ratio steps) — see `calculatePointInfo` in `src/utils.ts`.

### User flows

1. **Team hub** (`/teams/[teamId]`) — View roster-backed groups and past games. Start a game (opponent, pull side, offence start, mixed ratio if applicable). Open **Edit team groups** to manage groups and shuffle players between them.
2. **Game lineup** (`/games/[gameId]`) — See current score/context card, pick seven per side constraints (Mixed enforces gender caps per column; Open/Women use a seven-cap). Start a **point** → navigates to the active point tracker. If the DB already has an active point, the app redirects straight there.
3. **Live point** (`/points/[pointId]`) — Log events via disc-oriented actions, handle timeouts and subs, end the point (confirm score alignment), optionally edit the **current line** or pre-select **next line**, then proceed to another point or finish.
4. **Game summary** (`/games/[gameId]/summary`) — Aggregates per-player stats across all points/events for roster players in that game (`src/pages/api/games/[gameId]/summary.ts`).

The root route (`/`) is still the default Next.js splash page — **teams are keyed by UUID**; use a team id from Postgres or seeded migrations after setup.

---

## Stack

- **Runtime**: [Next.js](https://nextjs.org) (Pages Router) + React 19  
- **DB**: PostgreSQL via `pg`, schema with [Drizzle ORM](https://orm.drizzle.team/) (`src/database/schema.ts`)  
- **UI**: Joy UI/MUI Material, Ant Design (select components), Tailwind/CSS  

---

## Local development

### Prerequisites

- Current Node/npm (see `@types/node` in devDependencies if you pin versions)
- PostgreSQL reachable by a single `DATABASE_URL` connection string

### Environment

Copy `.env.example` to `.env` and adjust `DATABASE_URL` (and optional Compose variables).

```bash
cp .env.example .env
```

If you use Docker Compose for Postgres, set the `POSTGRES_*` vars from `.env.example`. **Schema is applied only via** `npm run migrate` (Compose does not run init SQL from this repo).

### Install, migrate, dev

```bash
npm install
npm run migrate   # reads .env via scripts/migrate.js
npm run dev
```

Other scripts: `npm run build`, `npm start`, `npm run lint`, `npm run format`, `npm run typecheck`, `npm test` / `npm run test:run`. New migration filenames: `npm run generate` (`scripts/generate-migration.sh`).

### Coding agents

**[AGENTS.md](AGENTS.md)** is the canonical, tool-agnostic guide (Cursor, Copilot, Claude Code, Codex, etc.) — verify loop, layout, migrations, API/domain rules, testing. **[CONTRIBUTING.md](CONTRIBUTING.md)** points here for humans and agents. After setup, open **http://localhost:3000/test** for the seeded Test Team. Backlog / out-of-scope: **[TODO.md](TODO.md)**.

---

## API surface (outline)

Routes under `src/pages/api/` back the UI: teams (`/api/teams/...`), games (`/api/games/...`), points (`/api/points/...`), including helpers like ending a half (`end-half`), ending a point, editing a line, and the summary aggregation endpoint.

---

## License / scope

Private project (`"private": true` in `package.json`). Intended for roster and game bookkeeping; not an auth-heavy multi-tenant product in its current shape.
