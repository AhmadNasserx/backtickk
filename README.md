# Backtickk

_Where developers write in the open._

Backtickk is a web app for developer communities. Visitors can browse communities built around technologies such as React, Next.js, PHP, Laravel, JavaScript and TypeScript, read technical posts written by members, and search and filter posts by community, topic and author. Community pages list their members. Signed-in users join communities, publish Markdown posts in the communities they belong to, bookmark posts, comment, and manage their profile and their own posts from a dashboard. Sign-in uses GitHub or Google through Auth.js, so the app stores no passwords.

Live demo: https://backtickk.vercel.app

## Tech stack

- **Next.js 16.2** with the App Router, Route Handlers and `proxy.ts`
- **React 19.2** and **TypeScript** in strict mode
- **Tailwind CSS v4** with a dark-only design system defined as theme tokens in `app/globals.css`
- **MongoDB Atlas** with **Mongoose 9** for data access
- **Auth.js v5** (`next-auth@5` beta) with GitHub and Google providers and JWT sessions
- **Zod 4** for validation on the client and on the server
- **react-markdown 10** for rendering post content (raw HTML is skipped)
- **ESLint 9** with `eslint-config-next`
- **Vitest 5** and **mongodb-memory-server** for the test suite

## Features

| Requirement | What it does | Routes |
|---|---|---|
| Public browsing | Home with featured communities, latest posts and trending topics. Community directory, blog listing, post, community and profile pages. Community pages show the newest members | `/`, `/communities`, `/blogs`, `/blogs/[slug]`, `/communities/[slug]`, `/profile/[username]` |
| Search and filters | Communities by name, description or topic. Posts by title, excerpt or tag, with community, topic and author filters (the author filter is a text field) and newest or oldest sort. Both lists paginate | `/communities`, `/blogs` |
| Live search | The top-bar search (`/` or Ctrl/Cmd+K on desktop, the search button on mobile) lists up to 5 matching posts and communities as you type. Arrow keys move through the results. Enter opens the highlighted result. With no result highlighted, Enter opens `/blogs?search=` (posts only) | `GET /api/search` |
| Authentication | GitHub and Google sign-in, sign-out, and a gate on personal pages | `/signin`, `/api/auth/*`, `proxy.ts` |
| Create, update, delete | Posts: create and edit with a Markdown editor and live preview, up to 5 tags, optional cover image URL, draft or published. Drafts have a preview page. Authors (and admins) delete posts. Profile: name, username, bio and skills | `/create`, `/blogs/[slug]/edit`, `/blogs/[slug]/preview`, `/settings` |
| Membership | Join and leave a community with an optimistic toggle. Posting requires membership | `/communities/[slug]` |
| Comments | Signed-in users comment on posts. The comment author, the post author or an admin can delete a comment | `/blogs/[slug]` |
| Bookmarks | Toggle a bookmark on a post and list saved posts, newest first | `/bookmarks` |
| Dashboard | Counts of published posts, bookmarks and communities. Own posts (including drafts) and joined communities. A profile checklist (bio, skills, a joined community, a first post) shows until all four are done | `/dashboard` |
| Welcome | No redirect follows the first sign-in; the dashboard checklist is the prompt. `/settings?welcome=1` shows a welcome banner, but nothing links to it yet | `/settings` |
| Roles | `user` by default. `admin` can edit and delete any post or comment | `ADMIN_EMAILS`, `User.role` |

Communities are created only by the seed script. No UI or API creates one.

## Getting started

### Prerequisites

- Node.js 20.9 or newer (the minimum declared by `next`) and npm
- A MongoDB database reachable through `MONGODB_URI`. A MongoDB Atlas free cluster works
- For sign-in: a GitHub OAuth App, a Google OAuth client, or both

### Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values described below
npm run seed                 # optional: sample communities, users, posts, comments
npm run dev                  # http://localhost:3000
```

### Environment variables

Values go in `.env.local`, which git ignores. `.env.example` lists the names with empty values.

| Variable | Required | Purpose | Where to get it |
|---|---|---|---|
| `MONGODB_URI` | Yes | Connection string used by the app and the seed script. Include a database name, for example `.../devcommunity` | MongoDB Atlas: cluster, Connect, Drivers |
| `AUTH_SECRET` | Yes in production | Secret used to encrypt the session cookie | Run `openssl rand -base64 32`. Without `openssl`, `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` gives an equivalent value |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | For GitHub sign-in | GitHub OAuth App credentials | GitHub: Settings, Developer settings, OAuth Apps |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | For Google sign-in | Google OAuth client credentials | Google Cloud Console: APIs and Services, Credentials, OAuth client ID (type Web application) |
| `AUTH_URL` | No | Public origin of the app. Usually unnecessary, because `trustHost` is enabled in `auth.config.ts` | Set `http://localhost:3000` locally, or your domain if callbacks point at the wrong host |
| `ADMIN_EMAILS` | No | Comma-separated emails promoted to `admin` at sign-in. It promotes but never demotes | Your own email addresses |

Local OAuth callback URLs to register with the providers:

- GitHub: `http://localhost:3000/api/auth/callback/github`
- Google: `http://localhost:3000/api/auth/callback/google`

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run seed` | Upserts the seed content. Re-running updates the same records instead of duplicating them |
| `npm run seed -- --reset` | Deletes the seed users (provider `seed`), their posts and memberships, and any comments or bookmarks that reference those posts or users. Then seeds again |
| `npm run build` | Production build. It prerenders `/`, which reads the database (see Deployment) |
| `npm start` | Serves the production build |
| `npm test` | Runs the test suite once (see Testing) |
| `npm run test:watch` | Runs the test suite in watch mode |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |

The seed data contains 6 communities, 5 users, 15 memberships, 14 posts, 13 comments and 10 bookmarks.

## Testing

Run the suite with `npm test`, or `npm run test:watch` while you work. It uses Vitest 5 (`vitest.config.mts`) and runs 171 tests in six files under `tests/`.

Integration tests start an in-memory MongoDB with `mongodb-memory-server`, so no database is needed. The first run downloads a `mongod` binary into `node_modules/.cache/mongodb-memory-server`. On a machine that cannot download it, set `MONGOMS_SYSTEM_BINARY` to a local binary's path for that shell. Do not commit the path.

| Area | What the tests cover |
|---|---|
| Schemas | Post, comment and profile rules, tag and skill normalisation, reserved usernames, lenient list queries, strict search query |
| Lib utilities | `slugify`, `readingTime`, `escapeRegex`, `canModify` and `assertCanModify`, `route()` error mapping |
| Authorization | Membership gate for posting, owner and admin rules for edits, deletes and comment deletes, draft visibility, `publishedAt` lifecycle |
| Membership | Idempotent join and leave, concurrent joins and leaves, `memberCount` consistency, community search, member list without email |
| Posts and search | Post filters, sort and pagination, regex-safe search, bookmarks, comment pagination |
| Users | OAuth first and returning sign-in, username assignment, `ADMIN_EMAILS` promotion, profile conflicts, public profile privacy |

Not covered: HTTP Route Handlers as endpoints, React components, the Auth.js sign-in flow and the seed script. The data layer is tested directly. `tests/README.md` describes the file layout and the fixture helpers.

## Architecture

### Folder map

| Path | Contents |
|---|---|
| `app/` | Routes: pages, layouts, `loading.tsx`, `error.tsx`, `not-found.tsx`, `forbidden.tsx`. Route groups `(list)` hold the list skeletons |
| `app/api/**/route.ts` | REST Route Handlers |
| `components/ui/` | Design system primitives: Button, Card, Input, Select, Textarea, Avatar, Badge, Pagination, EmptyState, Spinner, icons and logos |
| `components/layout/` | App shell, top bar, command search, search combobox, mobile search, mobile tab bar, user menu |
| `components/features/` | Feature components and client islands: join, bookmark, comments, delete, filters, search, member list, profile checklist, post cards and covers |
| `components/forms/` | Post, profile and sign-in forms, tag input, plus form error helpers |
| `components/motion/` | Motion pieces: count-up, cursor spotlight and logo marquee |
| `lib/` | Server helpers: `db.ts` (connection), `api.ts` (route wrapper and JSON helpers), `errors.ts`, `auth-helpers.ts`, `serialize.ts` (DTO mappers), `slug.ts`, `escape-regex.ts`, `utils.ts` |
| `lib/data/` | Service layer: `posts.ts`, `communities.ts`, `comments.ts`, `bookmarks.ts`, `users.ts`, `search.ts` |
| `models/` | Mongoose schemas, indexes and models |
| `schemas/` | Zod schemas for request bodies and query strings |
| `types/` | Shared types (DTOs, roles, statuses) and Auth.js type augmentation |
| `data/` | `navigation.ts` (top bar and mobile tab items, search link helper), `seed.ts` (seed content), `tech-logos.ts` (brand marks) |
| `scripts/seed.ts` | Idempotent seed script |
| `tests/` | Vitest suite and its setup helpers (see Testing) |
| `auth.ts`, `auth.config.ts`, `proxy.ts` | Full Auth.js setup (Node), the edge-safe config, and the route gate |

### Layering

Dependencies point one way:

1. **Pages** (`app/**/page.tsx`) load data and compose components.
2. **Components** (`components/`) render. Client islands hold only browser state.
3. **Schemas** (`schemas/`) validate input for the forms and the handlers.
4. **Models** (`models/`) describe stored data and its indexes.
5. **Services** (`lib/data/`) hold the rules and the queries. Pages and Route Handlers both call them.
6. **Route Handlers** (`app/api/**/route.ts`) expose the services over HTTP for client islands and other clients.

Server Components call services directly, with no HTTP hop. Services return DTOs built by `lib/serialize.ts`, never raw Mongoose documents. Public output never includes `email`.

### Request lifecycle: editing a post

`PATCH /api/posts/[id]`, sent by `components/forms/post-form.tsx`:

1. The form validates with `createPostSchema` and sends only the fields that changed.
2. The handler is wrapped by `route()` (`lib/api.ts`), which turns thrown errors into JSON responses.
3. `requireUser()` reads the session. Without a valid session the response is 401.
4. `parseJson(request, updatePostSchema)` validates the body again. Invalid input gets 400 with field errors. The handler uses only the parsed result.
5. `updatePost()` (`lib/data/posts.ts`) returns 404 if the post is missing, then calls `assertCanModify` (403 unless the user is the author or an admin). A move to another community also checks that the post's author is a member of it. Only then does it write.
6. The handler calls `revalidatePath` for the pages that show the post, and for the old community when the post moved. It returns the DTO.
7. The client navigates to the post and calls `router.refresh()`.

## Design system, logos and motion

**Direction.** "Ink & Lime": a warm near-black canvas, one acid-lime accent, Instrument Serif headlines, Geist body text and Geist Mono for tags and metadata. Tokens live in `app/globals.css` (`@theme`), so every colour, radius and font is a Tailwind utility (`bg-surface`, `text-muted`, `bg-accent`, `font-display`).

**Navigation.** A sticky top bar with a command-style search (`/` or Ctrl/Cmd+K) on desktop. On mobile, a compact top bar with a search button that opens a full-width search overlay, plus a fixed bottom tab bar. Primary controls (the bottom tab bar, buttons and form fields) are about 44px or larger; secondary text links and tag chips are smaller. The layout was checked with no horizontal overflow at 360, 390, 768 and 1360px.

**Brand logos.** Community and technology marks are the real SVG logos from [simple-icons](https://simpleicons.org) (CC0), bundled as path data in `data/tech-logos.ts` and rendered by `components/ui/tech-logo.tsx`. There is no runtime dependency and no image request. A community stores a logo slug in its `icon` field. Unknown values fall back to the first letter of the community name, never to emoji. Marks whose brand colour is too dark for the dark theme (Next.js, Rust, GitHub) switch to the foreground colour.

**Motion.** CSS-first, animating only `transform` and `opacity`, with no animation library:
- scroll-driven reveals with `animation-timeline: view()`, wrapped in `@supports` so unsupported browsers just show the content;
- a cursor spotlight on cards from one delegated, rAF-throttled pointer listener (`components/motion/spotlight.tsx`);
- a logo marquee, a count-up for the hero stats (server renders the final number, so there is no layout shift) and a short route fade (`app/template.tsx`);
- every animation is disabled under `prefers-reduced-motion`.

The hero text that determines Largest Contentful Paint is painted in the first frame; only subtle, non-hiding motion is applied to it.

**Performance.** Fonts are self-hosted through `next/font` (latin subset, `display: swap`). Post covers without an image are drawn in CSS, so most cards cost no image request. GitHub and Google avatars go through `next/image`. Joined-community state for a whole list is fetched once (`GET /api/me/communities`) instead of once per card. Lighthouse on the production build (local, simulated mobile): accessibility 100, best practices 100, SEO 100, performance 91 to 94 on the main pages, and a cumulative layout shift of about 0.001.

## Rendering strategy

| Route | Strategy | Why |
|---|---|---|
| `/` | ISR, `revalidate = 60` | Same content for every visitor. Post, membership and profile routes revalidate it on write |
| `/about` | Static | No request-time data |
| `/communities` | Dynamic | Search and topic filters come from `searchParams` |
| `/communities/[slug]` | ISR, `revalidate = 60`, `generateStaticParams` returns `[]` | Public community data and member list. Join and post routes revalidate it. Membership is a client island |
| `/blogs` | Dynamic | Search, filters, sort and pagination come from `searchParams` |
| `/blogs/[slug]` | ISR, `revalidate = 60`, `generateStaticParams` returns `[]` | Public post. Edit, delete and comment routes revalidate it. The page reads without a viewer, so drafts never render here |
| `/blogs/[slug]/preview` | Dynamic | Drafts are visible only to their author and admins, and others get 404. Signed-in only (`requireUserOrRedirect` and `proxy.ts`). Marked `noindex` |
| `/profile/[username]` | ISR, `revalidate = 120`, `generateStaticParams` returns `[]` | Public profile. Profile and published-post changes revalidate it. No query parameters; it lists the newest 20 posts |
| `/signin` | Dynamic | Reads `callbackUrl` and `error`, and checks for an existing session |
| `/dashboard`, `/bookmarks`, `/settings`, `/create`, `/blogs/[slug]/edit` | Dynamic | Depend on the signed-in user (`requireUserOrRedirect`). Also guarded by `proxy.ts` |
| `/api/**` | Dynamic (Route Handlers) | Read the request and the session |

Key decisions:

- **The root layout does not read the session.** It never calls `auth()`, `cookies()` or `headers()`. A single call there would make every page dynamic and defeat ISR. Per-user state (joined, bookmarked, owner controls, comment delete buttons) renders in client islands after the page loads, using `useSession`, `GET /api/me/communities`, and small `fetch` calls to the bookmark and join endpoints.
- **Unknown slugs return a real 404.** The detail routes have no `loading.tsx`. A loading boundary would start streaming with status 200 before `notFound()` runs, so the status could not change (see the Next.js `loading` docs). The list skeletons sit in `(list)` route groups, so they do not wrap the detail routes.
- **`generateStaticParams` returns `[]` on the detail routes.** `next build` does not render them. Each one renders on its first request and is then cached for its revalidate period. Of the pages, only `/` and `/about` are prerendered at build time.

## Server and client components

Twenty-two files are client components. Each one states its reason in its first lines.

| File | Why it is a client component |
|---|---|
| `components/providers.tsx` | `SessionProvider` shares the session through React context |
| `components/layout/nav-link.tsx` | `usePathname()` marks the active link |
| `components/layout/user-menu.tsx` | `useSession()` and `signOut()`, plus dropdown state |
| `components/layout/command-search.tsx` | The `/` and Ctrl/Cmd+K shortcuts need window key listeners, and the live results need state |
| `components/layout/search-combobox.tsx` | Debounced `/api/search` fetches with AbortController, keyboard navigation and focus tracking. Shared by the desktop and mobile search |
| `components/layout/mobile-search.tsx` | The search button opens a full-width overlay, which needs open state, focus handling and Escape |
| `components/features/blog-filters.tsx` | Filter changes, including the author field, write to the URL through the router |
| `components/features/search-bar.tsx` | Debounced search writes to the URL |
| `components/features/comment-section.tsx` | Comment form and delete controls depend on the viewer |
| `components/features/delete-post-button.tsx` | Two-step confirmation and `DELETE` request |
| `components/features/bookmark-button.tsx` | Per-viewer state with optimistic toggle |
| `components/features/join-community-button.tsx` | Per-viewer membership with optimistic toggle |
| `components/features/post-owner-actions.tsx` | Owner and admin controls depend on the session. Cosmetic only |
| `components/forms/post-form.tsx` | Live validation, Write and Preview tabs, `fetch` submit |
| `components/forms/profile-form.tsx` | Bio counter, skill chips, `PATCH`, and `update()` to refresh the token |
| `components/forms/signin-buttons.tsx` | `signIn()` and `signOut()` with pending state |
| `components/motion/count-up.tsx` | Counts up in the browser. The server HTML already holds the final number |
| `components/motion/spotlight.tsx` | Pointer position is known only in the browser. One listener serves every card |
| `app/error.tsx`, `app/blogs/error.tsx`, `app/communities/error.tsx`, `app/dashboard/error.tsx` | Error boundaries must be client components |

Helpers that these files import, such as `components/features/client-api.ts` and `components/forms/form-errors.ts`, have no directive and are bundled into them. The server-side pieces, such as `member-list.tsx`, `profile-completion.tsx` and `markdown-content.tsx`, have none.

## Data modeling

### Embed or reference

| Model (collection) | Key fields | Decision | Why |
|---|---|---|---|
| User (`users`) | `provider`, `providerAccountId`, `name`, `email`, `image`, `username`, `bio`, `skills` (max 15), `role` | Skills embedded. Users referenced by posts, comments, communities | Skills are bounded and read with the profile. Users are shared, so posts store only a reference. Author fields are copied at read time through `populate` with a field selector that excludes `email` |
| Community (`communities`) | `name`, `slug`, `description`, `topics` (max 12), `icon`, `color`, `createdBy`, `memberCount` | Topics embedded. Members in their own collection. `memberCount` is a denormalized counter | Topics are bounded and read with the community. Members are unbounded. The counter lets lists sort and display counts without counting memberships |
| Membership (`memberships`) | `user`, `community`, `createdAt` | Own collection, referenced both ways | Membership grows without bound, and it is queried from both sides: a user's communities, whether a user is a member, and a community's members |
| Post (`posts`) | `title`, `slug`, `excerpt`, `content`, `coverImage`, `author`, `community`, `tags` (max 5), `status`, `readingTime`, `publishedAt` | Tags embedded. Author and community referenced. Content stored in the post | Tags are bounded, read with the post, and filterable through a multikey index. Author and community are shared records. The post body is the post |
| Comment (`comments`) | `post`, `author`, `content` (max 1000), timestamps | Own collection, referenced by post | Comments grow without bound, are paginated, and are deleted on their own |
| Bookmark (`bookmarks`) | `user`, `post`, `createdAt` | Own collection | Queried both ways: a user's bookmarks, and whether one post is bookmarked |

Mongoose validates stored data (lengths, enums, the tag and skill caps). Zod validates requests before they reach the models.

### Indexes

| Collection | Index | Serves |
|---|---|---|
| `users` | unique `{ provider, providerAccountId }` | OAuth sign-in lookup in `upsertOAuthUser`, seed upsert |
| `users` | unique `{ username }` | Public profile lookup, the `?author=` filter, username uniqueness on profile save |
| `communities` | unique `{ slug }` | Community page, community filter on posts |
| `communities` | `{ memberCount, name }` | Featured communities and the community list, most members first, then by name |
| `memberships` | unique `{ user, community }` | Membership check, join and leave, duplicate-join protection |
| `memberships` | `{ community, createdAt, _id }` | Member list for a community, newest first with a stable tiebreak, and the member count for that list |
| `posts` | unique `{ slug }` | Post page, edit page, slug collision check |
| `posts` | `{ community, status, publishedAt }` | Community page and `/blogs?community=`, newest first |
| `posts` | `{ author, status, publishedAt }` | Profile page, dashboard lists, `/blogs?author=` |
| `posts` | `{ status, publishedAt }` | Home latest posts and the unfiltered `/blogs` feed |
| `posts` | `{ tags, status, publishedAt }` | Topic filter (`?topic=`) and topic chips |
| `comments` | `{ post, createdAt }` | Comment list and count for a post, and removing comments with a post |
| `bookmarks` | unique `{ user, post }` | Bookmark status, toggling without duplicates |
| `bookmarks` | `{ user, createdAt }` | A user's bookmark list, newest first, and its count |

The search regex on post titles, excerpts and tags cannot use an index. The query narrows by status, community, author or tag first, then applies the regex. See Known limitations.

### Upgrading an existing database

Two indexes changed. Mongoose builds missing indexes automatically but never drops one that was removed from the schema. On a database created before these changes, run this once in `mongosh` against the app's database:

```js
db.memberships.dropIndex('community_1')
db.communities.dropIndex('name_1')
```

If an index is already gone, MongoDB reports that it was not found, which is harmless. Fresh databases need nothing.

## API reference

All JSON endpoints return errors as `{ "error": { "message": "...", "details": ... } }`. Validation failures put `details` in the form `{ formErrors, fieldErrors }`. Any unexpected error returns 500 with `Internal server error`. Mongoose cast errors return 400.

| Method and path | Auth | Success | Error statuses |
|---|---|---|---|
| `GET /api/posts` | Optional. Drafts appear only when `author` is the viewer's own username | 200, paginated `PostSummaryDTO` | Query values are lenient: bad values fall back to defaults |
| `POST /api/posts` | Session | 201, `PostDetailDTO` | 400, 401, 403 (not a member of the community), 404 (unknown community), 409 (no unique slug after retries) |
| `GET /api/posts/[id]` | Optional | 200, `PostDetailDTO` | 400 (bad id), 404 (missing, or a draft the viewer cannot see) |
| `PATCH /api/posts/[id]` | Session, author or admin | 200, `PostDetailDTO` | 400 (bad id or body, including an empty patch), 401, 403, 404 |
| `DELETE /api/posts/[id]` | Session, author or admin | 200, `{ ok: true }` | 400, 401, 403, 404 |
| `GET /api/posts/[id]/comments` | Optional | 200, paginated `CommentDTO`, oldest first | 400, 404 (post not visible) |
| `POST /api/posts/[id]/comments` | Session | 201, `CommentDTO` | 400, 401, 404 (post not visible) |
| `DELETE /api/comments/[id]` | Session, comment author, post author or admin | 200, `{ ok: true }` | 400, 401, 403, 404 |
| `GET /api/posts/[id]/bookmark` | Session | 200, `{ bookmarked }` | 400, 401 |
| `PUT /api/posts/[id]/bookmark` | Session | 200, `{ bookmarked: true }` | 400, 401, 404 |
| `DELETE /api/posts/[id]/bookmark` | Session | 200, `{ bookmarked: false }` | 400, 401 |
| `GET /api/communities` | Public | 200, paginated `CommunityDTO` | Query values are lenient |
| `GET /api/communities/[id]/members` | Public | 200, paginated `MemberDTO`, newest first. No email | 400, 404 |
| `GET /api/communities/[id]/membership` | Session | 200, `{ member, memberCount }` | 400, 401, 404 |
| `POST /api/communities/[id]/join` | Session | 200, `{ member: true, memberCount }` | 400, 401, 404 |
| `DELETE /api/communities/[id]/join` | Session | 200, `{ member: false, memberCount }` | 400, 401, 404 |
| `GET /api/search?q=` | Public | 200, `{ posts, communities }`. `posts` is paginated, `communities` holds up to 6 matches | 400 when `q` is missing or not 2 to 100 characters. `page` and `limit` (1 to 50, default 10) are lenient |
| `GET /api/me` | Session | 200, `UserDTO` (includes the viewer's own email) | 401 |
| `GET /api/me/communities` | Session | 200, `{ ids: string[] }` of joined community ids (one request serves every join button on a page) | 401 |
| `PATCH /api/me` | Session | 200, `UserDTO` | 400, 401, 409 (username taken) |
| `GET, POST /api/auth/*` | Auth.js | Sign-in, callback, session and sign-out endpoints | Managed by Auth.js |

The bundled UI calls the post write endpoints, the bookmark endpoints, the join and leave endpoints, `GET /api/me/communities`, `GET /api/search` (from the live search) and `PATCH /api/me`. It does not call `GET /api/posts`, `GET /api/posts/[id]`, `GET /api/posts/[id]/comments`, `GET /api/communities`, `GET /api/communities/[id]/members`, `GET /api/communities/[id]/membership` or `GET /api/me`. Pages read those through the services on the server, so these endpoints form a JSON surface with no caller in this UI.

## Authentication and authorization

### Sign-in flow

1. "Continue with GitHub" or "Continue with Google" calls `signIn(provider, { redirectTo: callbackUrl })` (`components/forms/signin-buttons.tsx`).
2. Auth.js runs the OAuth flow and returns to `/api/auth/callback/<provider>`.
3. The `jwt` callback (`auth.ts`) runs on sign-in and calls `upsertOAuthUser` (`lib/data/users.ts`). It finds the `User` by provider and provider account id, or creates one. A new user's username comes from the GitHub login, or the email's local part, or the name, with a numeric suffix if taken. Existing users get their image and email refreshed on each sign-in.
4. The `jwt` callback stores `uid`, `username` and `role` in the token. The `session` callback copies them onto `session.user`.
5. Auth.js writes the encrypted JWT to the session cookie. There is no session table, so session validity comes from the cookie.
6. `getCurrentUser()` (`lib/auth-helpers.ts`) reads the session and then loads the `User` document for `name`, `username`, `image` and `role`. Each request loads the session user once through this function, memoized with React `cache`. A role or username change in the database therefore applies on the next request. Client islands read the token, so they update after a refresh. Saving the profile calls `update()` to refresh the token.

After the first sign-in the user lands where the callback points. There is no redirect to settings. Auth.js cannot reliably flag a just-created user without risking redirect loops, so the dashboard's profile checklist is the prompt.

### Proxy and server checks

`proxy.ts` (Next.js 16 uses `proxy` in place of `middleware`) guards `/dashboard`, `/bookmarks`, `/settings`, `/create`, `/blogs/:slug/edit` and `/blogs/:slug/preview`. Anonymous visitors are redirected to `/signin?callbackUrl=...`. The proxy uses only `auth.config.ts`, which does not touch the database. It is an optimistic gate: it checks that a session exists, not that the user is still valid. Pages and handlers check again on the server.

### 401, 403 and 404

- **401**: there is no valid session, so the server does not know who the caller is.
- **403**: the caller is signed in, but is not allowed to do this (not the owner or an admin, or not a member of the community). On pages, `forbidden()` renders `app/forbidden.tsx` with HTTP 403. The edit page uses it for a published post by another author. This relies on the experimental `experimental.authInterrupts` flag in `next.config.ts`.
- **404**: the resource does not exist, or is a draft the viewer cannot see on a read. For another author's draft, the edit page and the preview page return 404.

### Ownership and roles

| Action | Allowed for | Enforced in |
|---|---|---|
| Read a draft | Its author, admins | `isPostVisible` in `lib/data/posts.ts`. Listings show drafts only to their author |
| Create a post | Members of the target community | `createPost` (403 otherwise) |
| Edit a post | Author or admin | `updatePost` with `assertCanModify` |
| Move a post to another community | Author or admin. The post's author must be a member of the new community | `updatePost` |
| Delete a post | Author or admin. Its comments and bookmarks are removed too | `deletePost` |
| Delete a comment | Comment author, post author or admin | `deleteComment` |
| Comment, bookmark | Signed-in user, on a post they can see | `createComment`, `addBookmark` |
| Join or leave a community | The signed-in user, for themselves only | `joinCommunity`, `leaveCommunity` take the session user |
| Edit profile | The signed-in user | `updateProfile` |

Hidden buttons are not security. `PostOwnerActions`, the comment delete button and the edit link only decide what to show. Anyone can send `DELETE /api/posts/<id>` directly, so the service repeats the check.

## Validation

- **Shared schemas**: `schemas/post.ts`, `schemas/comment.ts`, `schemas/profile.ts` and `schemas/query.ts` define each rule once. Client forms call `safeParse` before sending. Route handlers call `parseJson` or `parseSearchParams`, and the services receive only the parsed output.
- **Rules** (selected): post title 5 to 120 characters, excerpt required and up to 240, content 20 to 20,000, up to 5 tags of 2 to 30 characters (`[a-z0-9+#.-]`, lowercased, deduplicated); cover image must be an http(s) URL; comment 1 to 1,000 characters; username 3 to 30 characters of `[a-z0-9_-]`, with `admin`, `api`, `settings`, `create`, `dashboard` and `signin` reserved; up to 15 skills of up to 30 characters.
- **Lenient list queries**: `postsQuerySchema`, `communitiesQuerySchema`, `membersQuerySchema` and `paginationQuerySchema` use `.catch()` defaults. A malformed URL renders the default view instead of an error. `searchQuerySchema` is strict because `q` has no sensible default.
- **Server errors map to fields**: a `ZodError` becomes 400 with `details.fieldErrors`. The client maps those names to the same inputs (`readFormFailure` in `components/forms/form-errors.ts`).
- **Ids**: `assertObjectId` at the service boundary returns 400 for a malformed id, rather than a cast error.
- **Markdown**: `skipHtml` drops raw HTML. External links open in a new tab with `noopener noreferrer nofollow`.

## Unhappy paths

| Situation | Handling |
|---|---|
| Loading | `loading.tsx` skeletons on `/communities`, `/blogs`, `/bookmarks` and `/dashboard`. Membership and bookmark buttons show a spinner until their status loads |
| Empty list | `EmptyState` with a next step. Filtered empty states offer "Clear filters" |
| Not found | `notFound()` renders `app/not-found.tsx` with HTTP 404. Used for unknown post, community and profile slugs, for edit and preview pages whose post is missing, and for drafts the viewer cannot see |
| Draft seen by a non-author | Public read returns 404. The edit page and the preview page also return 404 |
| Runtime error | `error.tsx` at the root and in `/blogs`, `/communities` and `/dashboard`, each with "Try again" and an error reference when Next provides one. Other routes use the root boundary |
| Validation | Client: Zod messages per field, and focus moves to the first invalid field. Server: 400 with field errors, shown on the same fields |
| Not signed in | API returns 401. Forms show "Your session has expired. Sign in again to continue." Membership and bookmark buttons treat a 401 on load as signed out. Signed-out clicks go to sign-in and return to the same page |
| Not allowed | API returns 403. The edit page for another author's published post returns 403 and renders `app/forbidden.tsx` |
| Network failure | Forms show "Network error. Check your connection and try again." Join and bookmark roll back their optimistic state |
| Server bug | 500 `Internal server error`, logged on the server |

## Quality notes

- **Moving a post** requires the post's author, not the editor, to be a member of the target community. Admins follow the same rule.
- **Tag and skill limits** count distinct entries. Tags are trimmed, lowercased and deduplicated before the 5-tag limit applies. Skills are trimmed and deduplicated case-insensitively before the 15-skill limit applies.

## Deployment

### 1. MongoDB Atlas

1. Create a free M0 cluster.
2. Under Database Access, create a database user with a strong password. Limit it to read and write on the app's database.
3. Under Network Access, add an entry. Vercel deployments do not use a fixed set of outbound IPs by default, so the usual choice is `0.0.0.0/0`. In that case the database password is the only protection, so make it strong.
4. Under Connect, choose Drivers and copy the `mongodb+srv://` string. Replace the password placeholder and add the database name (`/devcommunity`) before the query string.

### 2. Vercel

1. Import the GitHub repository as a new project. The Next.js preset is detected automatically.
2. Add the variables from the environment table for the Production environment (and Preview, if you test sign-in on preview deployments). Use a new `AUTH_SECRET` for production.
3. Deploy. The build runs `next build`.

### 3. Production OAuth callbacks

- **GitHub**: a GitHub OAuth App accepts one callback URL. Create a second OAuth App for production with `https://<your-domain>/api/auth/callback/github`, and use its ID and secret in production.
- **Google**: add `https://<your-domain>/api/auth/callback/google` to the OAuth client's authorized redirect URIs.

### 4. Redeploy after changing variables

Vercel applies environment variables to new deployments. Redeploy after changing any of them.

### 5. The build needs the database

`next build` prerenders `/`, an ISR page that reads communities, posts and topics from MongoDB. `MONGODB_URI` must therefore be set in the build environment. The detail routes are not prerendered (see Rendering strategy).

### 6. Seeding (optional)

`npm run seed` writes sample users, communities, posts and comments. Run it against a demo database only, by pointing `MONGODB_URI` at that database.

### Localhost and production differ

| Aspect | Local | Production |
|---|---|---|
| Origin | `http://localhost:3000` | `https://<your-domain>` |
| OAuth callback URLs | `http://localhost:3000/api/auth/callback/*` | `https://<your-domain>/api/auth/callback/*`, with separate GitHub credentials |
| Variables | `.env.local` | Vercel project settings |
| `AUTH_SECRET` | Recommended | Required |
| Session cookie | Not marked `Secure` over HTTP | Marked `Secure` over HTTPS |
| Caching | `next dev` does not behave like production. Check ISR with `npm run build && npm start`, as the Next.js docs recommend | ISR and on-demand revalidation are active |
| Database access | Your IP must be on the Atlas access list | Vercel must be able to reach Atlas |

## Git workflow

- The work is on `feature/devcommunity-capstone`, 26 commits ahead of `main`, which holds the Create Next App initial commit. A branch with the same name exists on `origin`.
- Commits are small and each covers one area: dependencies, design system and shell, models and schemas, authentication, data layer, Route Handlers, public and authenticated pages, the seed script. Later work came as separate `feat:`, `fix:`, `docs:` and `test:` commits, and follow-up corrections are separate `fix:` commits.
- Commit messages use `feat:`, `fix:`, `chore:`, `docs:` and `test:` prefixes.
- Secrets are not committed. `.env*` is git-ignored, and only `.env.example` is tracked. It contains names and empty values.

## Known limitations and next steps

- **Search**: post search is a case-insensitive escaped regex across title, excerpt and tags. Community search (name and description) uses the same kind of regex, and the community topic filter has no index. None of these can use an index, so each scans the documents that match the other filters first. This is fine at the current scale. The next step is a MongoDB text index or Atlas Search.
- **Experimental flag**: the 403 page relies on `experimental.authInterrupts` in `next.config.ts`, which is an experimental Next.js feature. Re-check it on each Next.js upgrade.
- **Member count** is a denormalized counter. Joins insert the membership first and increment only after a successful insert, so duplicate and racing requests are safe. There is no transaction, so a crash between the two writes leaves the count off. There is no reconciliation job except the seed script.
- **Lists stop at the first page on the post and community pages.** The post page shows the first 50 comments, oldest first. The community page shows the newest 12 members with a "+N more" count. The comments and members endpoints paginate, but the UI has no "load more".
- **Admins and drafts**: an admin can open any draft by its URL, but listings show drafts only to their author. The dashboard lists only the signed-in user's own drafts.
- **Draft existence leaks**: for a draft, a non-author gets 404 from `GET` but 403 from `PATCH` and `DELETE`, which reveals that the draft exists.
- **Accounts are not linked across providers.** A user is keyed by provider and provider account id, so a GitHub and a Google account with the same email are two users.
- **Community creation** exists only in the seed script. An admin UI is the next step.
- **Markdown** uses `react-markdown` without `remark-gfm`, so tables, strikethrough and task lists are not rendered.
- **Cover images and Markdown images** load any URL, unoptimized. Restrict the hosts if this goes beyond a demo.
- **No rate limiting** on write endpoints.
- **Bookmark deletion by post**: `deletePost` runs `Bookmark.deleteMany({ post })`, but no index leads with `post`. The unique index is `{ user, post }`. This is a cost at scale, not a correctness problem.
- **Bonus items** from the brief are not implemented.

## Technical defense cheat sheet

- **Why a Server Component?** It reads MongoDB directly through `lib/data`, adds no client JavaScript for read-only content, and can be cached. Browser-only needs move into small client islands.
- **Why `"use client"`?** Only where the file needs state, effects, event handlers, router hooks or the session. The 22 files and their reasons are in Server and client components.
- **ISR vs static vs dynamic?** Static for content with no request data (`/about`). ISR for public content that is identical for every visitor, accepting up to 60 seconds of staleness (120 for profiles) and revalidating on writes. Dynamic for anything read from `searchParams` or the session, including the draft preview.
- **Embed vs reference?** Embed what is bounded and read together: tags (max 5), topics (max 12), skills (max 15), and the post body. Reference what grows without bound or is queried or deleted separately: comments, memberships, bookmarks. Users and communities are shared records, so they are referenced.
- **Which index helps which query?** `{ status, publishedAt }` serves the home page and the unfiltered blog feed. `{ author, status, publishedAt }` serves profiles and the dashboard. `{ post, createdAt }` serves comment lists. `{ community, createdAt, _id }` serves the member list. Unique `{ user, post }` serves bookmark status and toggles.
- **MongoDB vs Atlas vs Mongoose?** MongoDB is the document database. Atlas is MongoDB's hosted service, where the cluster, users and network rules are set. Mongoose is the ODM in the app: schemas, indexes, populate and lean queries. Zod checks requests; Mongoose checks stored data.
- **Route Handler vs direct data call?** Server Components call `lib/data` directly, with no HTTP round trip. Route Handlers exist for the client islands and other clients. Both use the same services, so the authorization rules live in one place.
- **A manual `DELETE /api/posts/<id>` of someone else's post?** No session returns 401. A signed-in non-owner gets 403 as JSON, and nothing is deleted. The comments and bookmarks stay. An admin gets 200, and the post is removed with its comments and bookmarks. An unknown id gets 404.
- **Why does the server revalidate?** Hidden buttons are only a convenience, and the service enforces the rule on every request. Separately, `revalidatePath` makes ISR pages show a change immediately instead of after the 60-second window.
- **What does Auth.js do after OAuth?** The `jwt` callback creates or updates the `User` in MongoDB and sets `uid`, `username` and `role` in the token. The `session` callback copies them into the session. Auth.js writes the encrypted session cookie and redirects to `callbackUrl`. No session is stored in the database.
- **Authentication vs authorization?** Authentication answers who is calling: a valid session, checked by `requireUser`. Authorization answers whether they may do this to that resource: `assertCanModify` and the membership checks.
- **401 vs 403?** 401 means no valid session, so the caller is unknown. 403 means the caller is known and not allowed, and a page can render it with `forbidden()`. A missing or hidden resource is 404.
- **Localhost vs deployed?** The origin changes, so the OAuth callback URLs change, and GitHub needs a separate OAuth App. Variables move from `.env.local` to Vercel settings. `AUTH_SECRET` is required in production. Cookies are `Secure` over HTTPS. ISR behaves like production only in a build, and the database must accept connections from Vercel.
