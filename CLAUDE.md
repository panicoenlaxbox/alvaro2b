# CLAUDE.md

## Language

Everything committed to this repository must be written in English. This includes:

- Code: identifiers, comments, log and error messages
- Documentation: README, CLAUDE.md, ADRs, skills, and any other Markdown
- Configuration files and their comments (e.g. `.gitignore`)
- Commit messages, branch names, and pull request titles and descriptions

Conversation with the user may happen in another language; only the repository content must be in English.

## Skills

- Skills installed with `npx skills add` live in `.agents/skills/`. `.claude/skills/` only holds Windows junctions pointing to them, and each junction is listed individually in `.gitignore`.
- Custom skills go directly in `.claude/skills/<name>/` and are tracked by Git. Do not add them to `.gitignore`.
- After installing a new skill with `npx skills add`, add its junction to `.gitignore`.
