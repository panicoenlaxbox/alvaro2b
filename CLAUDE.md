# CLAUDE.md

Everything committed to this repository is written in English, except the text users read on screen, which is in Spanish (there is no i18n layer). URL routes, logs and error messages only developers see stay in English.

## Changing the app

1. Branch from `main`.
2. Add tests: domain logic in `src/lib/domain/` (`pnpm test`) and database rules in `supabase/tests/` (`pnpm supabase test db`).
3. Schema changes go in a new migration, tested locally with `pnpm supabase db reset`, then regenerate the types with `pnpm supabase gen types typescript --local > src/lib/supabase/database.types.ts`. Never edit an applied migration. Every new table needs Row Level Security with explicit policies and a `grant` to `authenticated`: the project does not expose new tables to the API on its own.
4. Check the change in Chrome against `http://localhost:3000` with the fictional seed data.
5. Commit, push and open a PR. CI must be green.
6. Before merging, apply new migrations with `pnpm supabase db push`, run the Supabase security advisors and fix every new warning.
7. Merge, then smoke-test `https://alvaro2b.vercel.app` without leaving data behind.

## Skills

Skills installed with `npx skills add` live in `.agents/skills/`. `.claude/skills/` holds junctions to them, each listed in `.gitignore`. Custom skills go directly in `.claude/skills/<name>/` and are tracked.
