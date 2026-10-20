# CLAUDE.md

## Language

Everything committed to this repository must be written in English. This includes:

- Code: identifiers, comments, log and error messages
- Documentation: README, CLAUDE.md, skills, and any other Markdown not listed under the exceptions below
- Configuration files and their comments (e.g. `.gitignore`)
- Commit messages, branch names, and pull request titles and descriptions

Conversation with the user may happen in another language; only the repository content must be in English.

### Exceptions (Spanish)

These are deliberate. Do not translate them to English.

- Product and domain documents are written in Spanish: `GLOSSARY.md` and everything under `docs/` (PRD, ADRs, setup, plan and owner tasks). Domain entity names stay in English (Session, Play, Game, Poll…), as do file names and ADR slugs.
- User-facing UI text is in Spanish. There is no i18n layer. Code, comments, logs and error messages that only developers see stay in English. URL routes are in English too (e.g. `/privacy`, `/sessions`, `/games`), even though the pages they serve are in Spanish.

## Domain

- `GLOSSARY.md` defines the domain vocabulary. Use its terms in code and docs.
- `docs/PRD.md` describes what the app does today. `docs/adr/` records architectural decisions.
- `docs/SETUP.md` lists the owner's one-time setup, environments, secret names and the agent's red lines. Respect those red lines.
- `docs/TASKS.md` is the owner's to-do list. When something can only be done by the owner, add it there instead of blocking.
- `docs/PLAN.md` is the frozen log of the initial build. It is history: read it for context, leave it unchanged.

## Changing the app

Every change, however small, follows this flow:

1. Branch from `main`.
2. Tests: domain logic in `src/lib/domain/` (Vitest, `pnpm test`) and database rules in `supabase/tests/` (pgTAP, `pnpm test:db`).
3. Schema changes as a new migration, tested with `pnpm db:reset` locally. Applied migrations are never edited.
4. Check the change in Chrome against `http://localhost:3000` with the fictional seed data.
5. Open a PR and review it. CI must be green.
6. Apply new migrations to production with `pnpm supabase db push` before merging, run the Supabase security advisors and fix every new warning.
7. Merge, then smoke-test `https://alvaro2b.vercel.app` without leaving data behind.

Update the docs in the same PR as the code, by what the change touches:

| The change… | Update |
|---|---|
| alters what the app does (a feature, a rule, a screen's behaviour) | `docs/PRD.md`, so it keeps describing the current app |
| adds a domain term or changes its meaning | `GLOSSARY.md` |
| reverses or replaces an architectural decision | a new ADR in `docs/adr/` with the next number, saying which ADR it supersedes; in the old ADR add only a first line `> Sustituido por [NNNN](./NNNN-slug.md).` |
| needs something only the owner can do | `docs/TASKS.md` |
| changes environments, secrets or setup | `docs/SETUP.md` |
| changes how to run or develop the project | `README.md` |
| fixes a bug or adjusts copy or styling | no docs |

ADRs are append-only records: the superseded note is the only edit an existing ADR ever gets. Before coding a large or ambiguous change, grill the owner with the `grilling` skill until the behaviour is clear.

## Public repository

This repository is public (MIT license). Therefore:

- Never commit secrets: BGG token, Supabase `service_role` key, etc. They live only in Vercel environment variables, GitHub Secrets and, locally, in the `env` block of the git-ignored `.claude/settings.local.json`. Commit a `.env.example` with variable names and no values.
- Use only fictional data in seeds, tests, fixtures and docs. Never commit real names, emails or photos of the group.
- Every Supabase table must have Row Level Security enabled with explicit policies. The `anon` key is public, so RLS is the real protection.
- The Supabase project does not expose new tables to the Data API automatically. Every migration that creates a table must also grant the needed privileges to the API roles (`authenticated`, and `anon` only if truly required).
- Schema changes go only through versioned migrations applied with the Supabase CLI, tested locally first. The Supabase GitHub integration is not used, and the Supabase MCP server is read-only.

## Skills

- Skills installed with `npx skills add` live in `.agents/skills/`. `.claude/skills/` only holds Windows junctions pointing to them, and each junction is listed individually in `.gitignore`.
- Custom skills go directly in `.claude/skills/<name>/` and are tracked by Git. Do not add them to `.gitignore`.
- After installing a new skill with `npx skills add`, add its junction to `.gitignore`.
