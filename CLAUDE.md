@AGENTS.md

# Working Agreement

## Roles

- **Planner / supervisor:** whichever model is selected for the current session. It plans the work, breaks it into tasks, delegates implementation, reviews the results, and verifies they meet the request.
- **Implementer:** always the latest available version of Claude Haiku. All code writing and editing is delegated to Haiku via the Agent tool (set `model: "haiku"`, which resolves to the newest Haiku; currently `claude-haiku-5-5`).

- **Haiku effort:** always run Haiku implementers at `high` effort (pass `effort: "high"` on every Agent call that uses `model: "haiku"`).

## Workflow

1. **Plan** (session model): understand the request, inspect the code as needed, and decide what changes are required. Don't write the implementation yourself.
2. **Delegate** (Haiku): hand each implementation task to a Haiku subagent with a self-contained prompt: the files involved, the exact change, constraints, and how to verify it. Independent tasks can run in parallel.
3. **Supervise** (session model): read the diffs Haiku produced, run the build/tests/lint, and check the result against the request. If it is wrong or incomplete, send precise corrections back to Haiku instead of fixing it directly.
4. **Report**: summarize what changed and what was verified, and be honest about anything that failed or was skipped.

## Exceptions

- Trivial edits (a typo, a one-line config tweak) may be made directly by the supervisor when delegating would cost more than the change.
- Read-only exploration and answering questions do not need Haiku.
- If the user explicitly asks for a different arrangement in a session, follow that instead.

# Repository rules

- **No attribution.** This is Ahmad Nasser's repository. Never add yourself as a co-author, never add `Co-Authored-By` or "Generated with" lines to commits or pull requests, and never mention an AI tool in code, comments, docs, commit messages or PR text. Commits must be authored by the repository owner: check `git config user.name` and `git config user.email` before the first commit in a session.
- **No secrets in Git.** `.env.local` is ignored. Document environment variable names only (see `.env.example`), never values. Never paste connection strings, OAuth secrets or `AUTH_SECRET` into chat, files, commits or PRs.
- **Git workflow.** Do not work on `main`. Use a feature branch, make small commits that each describe one logical change, and open a pull request for review.
- **Next.js 16 has breaking changes.** Read the relevant page under `node_modules/next/dist/docs/` before using a Next API (see AGENTS.md). `middleware` is `proxy.ts`, `params` and `searchParams` are Promises, and this project does not enable `cacheComponents`.
- **Verify before claiming.** Run `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build` before saying something works, and report failures plainly.
