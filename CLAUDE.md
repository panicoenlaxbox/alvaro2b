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

- Product and domain documents are written in Spanish: `GLOSSARY.md` and everything under `docs/` (PRD, ADRs). Domain entity names stay in English (Session, Play, Game, Poll…), as do file names and ADR slugs.
- User-facing UI text is in Spanish. There is no i18n layer. Code, comments, logs and error messages that only developers see stay in English. URL routes are in English too (e.g. `/privacy`, `/sessions`, `/games`), even though the pages they serve are in Spanish.

## Domain

- `GLOSSARY.md` defines the domain vocabulary. Use its terms in code and docs.
- `docs/PRD.md` describes scope and features. `docs/adr/` records architectural decisions.
- `docs/SETUP.md` lists the owner's one-time setup, environments, secret names and the agent's red lines. Respect those red lines.

## Public repository

This repository is public (MIT license). Therefore:

- Never commit secrets: BGG token, Supabase `service_role` key, backup encryption key, etc. They live only in Vercel environment variables, GitHub Secrets and, locally, in the `env` block of the git-ignored `.claude/settings.local.json`. Commit a `.env.example` with variable names and no values.
- Use only fictional data in seeds, tests, fixtures and docs. Never commit real names, emails or photos of the group.
- Every Supabase table must have Row Level Security enabled with explicit policies. The `anon` key is public, so RLS is the real protection.
- The Supabase project does not expose new tables to the Data API automatically. Every migration that creates a table must also grant the needed privileges to the API roles (`authenticated`, and `anon` only if truly required).
- Schema changes go only through versioned migrations applied with the Supabase CLI, tested locally first. The Supabase GitHub integration is not used, and the Supabase MCP server is read-only.

## Skills

- Skills installed with `npx skills add` live in `.agents/skills/`. `.claude/skills/` only holds Windows junctions pointing to them, and each junction is listed individually in `.gitignore`.
- Custom skills go directly in `.claude/skills/<name>/` and are tracked by Git. Do not add them to `.gitignore`.
- After installing a new skill with `npx skills add`, add its junction to `.gitignore`.
