# CLAUDE.md

Everything committed to this repository is written in English, except the user-facing UI text, which is in Spanish (there is no i18n layer). URL routes stay in English.

## Changing the app

1. Branch from `main`.
2. Add tests: domain logic in `src/lib/domain/` (`pnpm test`) and database rules in `supabase/tests/` (`pnpm supabase test db`).
3. Schema changes go in a new migration, tested locally with `pnpm supabase db reset`. Never edit an applied migration.
4. Check the change in Chrome against `http://localhost:3000` with the fictional seed data.
5. Open a PR. CI must be green.
6. Before merging, apply new migrations with `pnpm supabase db push -p $env:PROD_DB_PASSWORD`, run the Supabase security advisors and fix every new warning.
7. Merge, then smoke-test `https://alvaro2b.vercel.app` without leaving data behind.

Keep `README.md` up to date when the change affects how to run, develop or deploy the project.

## Public repository

- Never commit secrets. Locally they live in the `env` block of the git-ignored `.claude/settings.local.json`; `.env.example` lists variable names only. The production database password is `PROD_DB_PASSWORD`, never `SUPABASE_DB_PASSWORD`: the Supabase CLI would pick that one up for local commands too.
- Use only fictional data in seeds, tests and fixtures.
- Every table has Row Level Security with explicit policies and grants only the privileges the API roles need (`authenticated`, `anon` only if truly required).
- Schema changes go only through migrations applied with the Supabase CLI. The Supabase MCP server is read-only.

## Skills

Skills installed with `npx skills add` live in `.agents/skills/`. `.claude/skills/` holds junctions to them, each listed in `.gitignore`. Custom skills go directly in `.claude/skills/<name>/` and are tracked.
