# Handoff: finish deployment of Backtickk

This file lets a new local Claude Code session pick up exactly where the cloud session stopped. Read it fully, then follow "Start here". The product is built, tested and documented. What remains is **deployment and real OAuth**, which need the owner's accounts and secrets and therefore must happen locally.

## Snapshot

| Item | State |
|---|---|
| Repository | `AhmadNasserx/backtickk` |
| **Branch to pull** | **`main`**. It contains the whole project: pull request #2 (`feature/devcommunity-capstone`) was merged into it with a merge commit, so the individual commits are preserved. |
| Branches to ignore | `feature/devcommunity-capstone` (merged, kept only for reference), `ccr-1d9328e3-kng7qp` (a cloud session branch), `assignment-01-ahmad-nasser` (the owner's own earlier branch) |
| App name | **Backtickk** (previously DevCommunity, then Backtick; the package.json name is unchanged) |
| Stack | Next.js 16.2 (App Router), React 19, TypeScript, Tailwind v4, MongoDB + Mongoose 9, Auth.js v5 (`next-auth@beta`), Zod 4, Vitest |
| Quality gates last run | lint clean, `tsc` clean, 171 tests pass, production build passes, no horizontal overflow on 18 pages at 360/390/768/1360px, Lighthouse accessibility 100 and performance about 91 to 94 on main pages (local, simulated mobile) |
| Not done | Vercel deployment, Atlas production database, real GitHub and Google OAuth, README live URL |

### Where the owner stopped
The owner is setting up MongoDB Atlas by hand (not through the Vercel Marketplace). They have a free cluster named **Cluster0** in a project called Project 0 and reported finishing the **database user** step. Assume the network access entry (`0.0.0.0/0`) and the connection string may still need checking. Do not assume anything about their Vercel or OAuth setup: ask.

## Start here

```bash
git clone https://github.com/AhmadNasserx/backtickk.git
cd backtickk
git checkout main
git pull origin main                                # main holds everything; confirm with: git log --oneline | head
git checkout -b feature/deployment                  # CLAUDE.md forbids working on main: use a branch for any repo change
git config user.name && git config user.email      # must be the owner's identity before any commit
npm install
cp .env.example .env.local                        # then fill values locally, never commit them
npm run lint && npx tsc --noEmit && npm test && npm run build
```

Node 22 is expected (the project uses `@types/node` 22). `npm test` starts an in-memory MongoDB and downloads a `mongod` binary on first run, so it needs network access once.

Then read, in this order: `CLAUDE.md` (working agreement and rules), `AGENTS.md`, `README.md` (architecture, rendering strategy, API table, deployment section, defense cheat sheet) and `tests/README.md`.

## Environment variables (names only)

Set these in `.env.local` for local work and in Vercel for deployment. Never commit values.

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Atlas connection string. **Must end with a database name**, for example `.../backtick?retryWrites=true&w=majority`. Without one MongoDB uses `test`. URL-encode special characters in the password. |
| `AUTH_SECRET` | Signs session tokens. Generate with `openssl rand -base64 32`. Required in production. |
| `AUTH_URL` | Public origin, for example `https://<project>.vercel.app`. Optional because `trustHost` is on, but set it explicitly in production. |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | GitHub OAuth app credentials. |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth client credentials. |
| `ADMIN_EMAILS` | Optional, comma separated. Those emails become admins when they sign in. |

## Remaining tasks

### 1. Finish MongoDB Atlas
1. **Network Access:** Security, Network Access, Add IP Address, Allow access from anywhere (`0.0.0.0/0`). Vercel uses changing IPs, so this entry is required. The database password is what protects it.
2. **Database user:** confirm it exists with read/write access (Security, Database Access). Prefer a generated password without special characters.
3. **Connection string:** Connect on Cluster0, Drivers, Node.js. Replace `<password>` and add the database name (`/backtick`).
4. **Seed it once from the laptop:** put the string in `.env.local`, run `npm run seed`, and confirm in Atlas Browse Collections that `users`, `communities`, `posts` and the rest exist. The seed is idempotent. `npm run seed -- --reset` deletes only seeded content, never real users' own data except their comments and bookmarks on seeded posts.
5. Indexes are created automatically the first time the app connects. A fresh Atlas database needs no manual index work. (The README's note about dropping `community_1` on `memberships` and `name_1` on `communities` only applies to older databases.)

### 2. Create the OAuth apps
Create separate apps for local and production, because GitHub OAuth apps accept only one callback URL.

- **GitHub:** Settings, Developer settings, OAuth Apps, New OAuth App. Callback URL `http://localhost:3000/api/auth/callback/github` for local and `https://<prod-domain>/api/auth/callback/github` for production.
- **Google (the brief's research challenge, so the owner should understand it):** Google Cloud Console, create a project, OAuth consent screen (External; add the owner's Google account as a test user until it is published), then Credentials, Create OAuth client ID, Web application. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://<prod-domain>/api/auth/callback/google`.
- Test both locally first (`npm run dev`, fill `.env.local`, sign in with each provider), then repeat in production.

### 3. Deploy to Vercel
1. Vercel, Add New, Project, import the GitHub repo. Next.js is auto-detected, so keep the default build settings.
2. Branch: deploy **`main`** (PR #2 is already merged into it). Make sure Vercel's Production Branch is `main`.
3. Settings, Environment Variables: add every variable from the table above for Production (and Preview if you want preview deployments to work). Without `MONGODB_URI` the **build fails**, because the home page pre-renders against the database.
4. Deploy and read the build log. Fix errors rather than assuming localhost behavior carries over.
5. After the first deploy you know the production domain: set `AUTH_URL`, update the GitHub and Google redirect URIs to that domain, and **redeploy** (environment variable changes only apply to new deployments).
6. Put the live URL into the README placeholder line `Live demo: _add your Vercel URL here after deploying_`. Do this on the `feature/deployment` branch, push it and open a small pull request into `main`.

### 4. Production verification checklist
This mirrors the submission checklist in the capstone brief. Check each item on the live URL and report failures honestly.

- [ ] Public deployment URL works and the home page shows seeded communities and posts.
- [ ] GitHub sign-in works in production and creates a user.
- [ ] Google sign-in works in production.
- [ ] `/dashboard`, `/settings`, `/create`, `/bookmarks` redirect to sign-in when signed out.
- [ ] Join a community, publish a post, comment, bookmark, edit and delete your own post.
- [ ] Another user's edit URL returns the real 403 page, and a manual `DELETE /api/posts/<id>` on someone else's post returns 403 (anonymous returns 401).
- [ ] Search, topic, community and author filters and pagination work with real Atlas data.
- [ ] An unknown slug (`/blogs/nope`) shows the 404 page with a 404 status.
- [ ] Mobile layout is usable (bottom tab bar, no horizontal scroll).
- [ ] No secrets in the repository: `git log -p | grep -iE "mongodb\+srv|AUTH_SECRET|client_secret"` finds nothing real.
- [ ] README lists the live URL, environment variable names and deployment steps.

### 5. Finish the repository
PR #2 is already merged. For anything further (the live URL in the README, fixes found during deployment) use the `feature/deployment` branch with small, unattributed commits (see `CLAUDE.md`), open a pull request into `main`, and make sure the final state is on `main` before submission.

## Gotchas learned in this project

- **Next.js 16:** `proxy.ts` replaces `middleware.ts`. `params` and `searchParams` are Promises. `error.tsx` receives `unstable_retry`. `forbidden()` needs `experimental.authInterrupts: true`, already set in `next.config.ts`. `cacheComponents` is intentionally off, so ISR uses `export const revalidate`.
- **Rendering split matters:** the root layout must never read the session or cookies, or every page becomes dynamic and ISR stops working. Personalised bits (join, bookmark, owner buttons) are small client components using `useSession`.
- **Auth.js v5 beta:** providers read `AUTH_GITHUB_ID` and similar names automatically. Sessions are JWT with no database adapter. The `jwt` callback upserts the user in MongoDB on first sign-in. On HTTPS the session cookie is named `__Secure-authjs.session-token`, on HTTP `authjs.session-token`.
- **Authorization lives in the data layer** (`lib/data/*`), not in route files, so every caller is covered. Do not move ownership checks into UI code.
- **The DB name in the URI matters**: the app, the seed script and Atlas must all use the same database.
- **Vercel Hobby has no fixed IPs**, so Atlas needs `0.0.0.0/0`. A leaked connection string is full access, so rotate the database password in Atlas if it ever appears anywhere public.
- **Known limitations** (all listed in the README): search is an escaped regex rather than a text index, `memberCount` is a counter updated without a transaction, only the first 50 comments show, accounts are not linked across providers, and secondary text links and tag chips are smaller than 44px.
- **Tests:** the suite uses an in-memory MongoDB and mocks `@/auth`. If `npm test` cannot download the `mongod` binary, set `MONGOMS_SYSTEM_BINARY` to a local binary (see `tests/README.md`).

## Starter prompt for the local Claude session

Paste this as the first message:

> First make sure you are on the right branch: run `git checkout main && git pull origin main`, then create a working branch with `git checkout -b feature/deployment` (never commit to `main` directly). Then read `HANDOFF.md`, `CLAUDE.md`, `AGENTS.md` and `README.md` in this repository, and follow the working agreement in `CLAUDE.md`. Run the quality gates (lint, tsc, tests, build) and tell me the result. Then walk me through the remaining tasks in `HANDOFF.md` one at a time: finishing Atlas, creating the GitHub and Google OAuth apps, deploying to Vercel, and the production verification checklist. I have already created an Atlas cluster and a database user. Ask me for anything you need, but never ask me to paste secrets into the chat; I will put them in `.env.local` and in the Vercel dashboard myself. Add no attribution to commits or PRs.

## What does not travel with the repo

- The showreel video (`backtick-showreel-with-sound.mp4` and the silent copy) was delivered in the cloud session chat. Its recording scripts lived in that session's temporary scratch folder and were not committed. Re-making the video would need a new session.
- Local development data lived in a throwaway MongoDB in that cloud session. Nothing there matters. Use your own local MongoDB or Atlas.
