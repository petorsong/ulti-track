# Contributing

## Setup and product context

See [README.md](README.md) for what the app does and how to run it locally (`cp .env.example .env`, `npm run migrate`, `npm run dev`).

## Instructions for coding agents

**[AGENTS.md](AGENTS.md)** is the single source of truth for verification commands, repository layout, migrations, API patterns, domain rules, and testing. It is written to be **tool-agnostic** — use it with Cursor, Copilot, Claude Code, Codex, or any other assistant without IDE-specific config.

**Portable repo:** No employer/corporate coupling — public npm only, no private registries or internal packages. See [Portable repo](AGENTS.md#portable-repo-no-corporate-coupling) in AGENTS.md.

## Scope and backlog

Out-of-scope and deferred items: [TODO.md](TODO.md).
