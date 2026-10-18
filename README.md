# DevCommunity

DevCommunity is a web app for developer communities. Visitors can browse communities built around technologies such as React, Next.js, PHP, Laravel, JavaScript and TypeScript, read technical posts written by members, and search and filter posts by community, topic and author. Signed-in users join communities, publish Markdown posts in the communities they belong to, bookmark posts, comment, and manage their profile and their own posts from a dashboard. Sign-in uses GitHub or Google through Auth.js, so the app stores no passwords.

Live demo: _add your Vercel URL here after deploying_

## Tech stack

- **Next.js 16.2** with the App Router, Route Handlers and `proxy.ts`
- **React 19.2** and **TypeScript** in strict mode
- **Tailwind CSS v4** with a dark-only design system defined as theme tokens in `app/globals.css`
- **MongoDB Atlas** with **Mongoose 9** for data access
- **Auth.js v5** (`next-auth@5` beta) with GitHub and Google providers and JWT sessions
- **Zod 4** for validation on the client and on the server
- **react-markdown 10** for rendering post content (raw HTML is skipped)
- **ESLint 9** with `eslint-config-next`

## Features

| Requirement | What it does | Routes |
|---|---|---|
| Public browsing | Home with featured communities, latest posts and trending topics. Community directory, blog listing, post, community and profile pages | `/`, `/communities`, `/blogs`, `/blogs/[slug]`, `/communities/[slug]`, `/profile/[username]` |
| Search and filters | Communities by name or description, and by topic. Posts by title, excerpt or tag, with community, topic and author filters (author is URL-only, there is no UI control) and newest or oldest sort. Both lists paginate | `/communities`, `/blogs` |
| Authentication | GitHub and Google sign-in, sign-out, and a gate on personal pages | `/signin`, `/api/auth/*`, `proxy.ts` |
| Create, update, delete | Posts: create and edit with a Markdown editor and live preview, up to 5 tags, optional cover image URL, draft or published. Authors (and admins) delete posts. Profile: name, username, bio and skills | `/create`, `/blogs/[slug]/edit`, `/settings` |
| Membership | Join and leave a community with an optimistic toggle. Posting requires membership | `/communities/[slug]` |
| Comments | Signed-in users comment on posts. The comment author, the post author or an admin can delete a comment | `/blogs/[slug]` |
| Bookmarks | Toggle a bookmark on a post and list saved posts, newest first | `/bookmarks` |
| Dashboard | Counts of published posts, bookmarks and communities. Own posts (including drafts) and joined communities | `/dashboard` |
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
| `npm run seed -- --reset` | Deletes the seed users (provider `seed`), the posts they wrote, and any comments or bookmarks that reference those posts or users. Then seeds again |
| `npm run build` | Production build. It prerenders `/`, which reads the database (see Deployment) |
| `npm start` | Serves the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |

The seed data contains 6 communities, 5 users, 15 memberships, 14 posts, 13 comments and 10 bookmarks.

## Architecture

### Folder map

| Path | Contents |
|---|---|
| `app/` | Routes: pages, layouts, `loading.tsx`, `error.tsx`, `not-found.tsx`. Route groups `(list)` hold the list skeletons |
| `app/api/**/route.ts` | REST Route Handlers |
| `components/ui/` | Design system primitives: Button, Card, Input, Avatar, Pagination, EmptyState |
| `components/layout/` | App shell: sidebar, top bar, mobile drawer, search, user menu |
| `components/features/` | Feature components and client islands (join, bookmark, comments, delete, search) |
| `components/forms/` | Post, profile and sign-in forms, plus form error helpers |
| `lib/` | Server helpers: `db.ts` (connection), `api.ts` (route wrapper and JSON helpers), `errors.ts`, `auth-helpers.ts`, `serialize.ts` (DTO mappers), `slug.ts`, `escape-regex.ts`, `utils.ts` |
| `lib/data/` | Service layer: `posts.ts`, `communities.ts`, `comments.ts`, `bookmarks.ts`, `users.ts`, `search.ts` |
| `models/` | Mongoose schemas, indexes and models |
| `schemas/` | Zod schemas for request bodies and query strings |
| `types/` | Shared types (DTOs, roles, statuses) and Auth.js type augmentation |
| `data/` | `navigation.ts` (sidebar items) and `seed.ts` (seed content) |
| `scripts/seed.ts` | Idempotent seed script |
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
5. `updatePost()` (`lib/data/posts.ts`) returns 404 if the post is missing, then calls `assertCanModify` (403 unless the user is the author or an admin). A change of community also checks membership. Only then does it write.
6. The handler calls `revalidatePath` for the pages that show the post and returns the DTO.
7. The client navigates to the post and calls `router.refresh()`.

## Rendering strategy

| Route | Strategy | Why |
|---|---|---|
| `/` | ISR, `revalidate = 60` | Same content for every visitor. Post, membership and profile routes revalidate it on write |
| `/about` | Static | No request-time data |
| `/communities` | Dynamic | Search and topic filters come from `searchParams` |
| `/communities/[slug]` | ISR, `revalidate = 60`, `generateStaticParams` returns `[]` | Public community data. Join and post routes revalidate it. Membership is a client island |
| `/blogs` | Dynamic | Search, filters, sort and pagination come from `searchParams` |
| `/blogs/[slug]` | ISR, `revalidate = 60`, `generateStaticParams` returns `[]` | Public post. Edit, delete and comment routes revalidate it. The page reads without a viewer, so drafts never render here |
| `/profile/[username]` | ISR, `revalidate = 120`, `generateStaticParams` returns `[]` | Public profile. Profile and published-post changes revalidate it. No query parameters; it lists the newest 20 posts |
| `/signin` | Dynamic | Reads `callbackUrl` and `error`, and checks for an existing session |
| `/dashboard`, `/bookmarks`, `/settings`, `/create`, `/blogs/[slug]/edit` | Dynamic | Depend on the signed-in user (`requireUserOrRedirect`). Also guarded by `proxy.ts` |
| `/api/**` | Dynamic (Route Handlers) | Read the request and the session |

Key decisions:

- **The root layout does not read the session.** It never calls `auth()`, `cookies()` or `headers()`. A single call there would make every page dynamic and defeat ISR. Per-user state (joined, bookmarked, owner controls, comment delete buttons) renders in client islands after the page loads, using `useSession` and small `fetch` calls to the membership and bookmark endpoints.
- **Unknown slugs return a real 404.** The detail routes have no `loading.tsx`. A loading boundary would start streaming with status 200 before `notFound()` runs, so the status could not change (see the Next.js `loading` docs). The list skeletons sit in `(list)` route groups, so they do not wrap the detail routes.
- **`generateStaticParams` returns `[]` on the detail routes.** `next build` does not render them. Each one renders on its first request and is then cached for its revalidate period. Of the pages, only `/` and `/about` are prerendered at build time.

## Server and client components

Nineteen files are client components. Each one states its reason in its first lines.

| File | Why it is a client component |
|---|---|
| `components/providers.tsx` | `SessionProvider` shares the session through React context |
| `components/layout/mobile-nav.tsx` | Drawer open state, and closing on Escape |
| `components/layout/global-search.tsx` | Submits with `router.push` |
| `components/layout/nav-link.tsx` | `usePathname()` marks the active link |
| `components/layout/user-menu.tsx` | `useSession()` and `signOut()`, plus dropdown state |
| `components/features/blog-filters.tsx` | Filter changes write to the URL through the router |
| `components/features/search-bar.tsx` | Debounced search writes to the URL |
| `components/features/comment-section.tsx` | Comment form and delete controls depend on the viewer |
| `components/features/delete-post-button.tsx` | Two-step confirmation and `DELETE` request |
| `components/features/bookmark-button.tsx` | Per-viewer state with optimistic toggle |
| `components/features/join-community-button.tsx` | Per-viewer membership with optimistic toggle |
| `components/features/post-owner-actions.tsx` | Owner and admin controls depend on the session. Cosmetic only |
| `components/forms/post-form.tsx` | Live validation, Write and Preview tabs, `fetch` submit |
| `components/forms/profile-form.tsx` | Bio counter, skill chips, `PATCH`, and `update()` to refresh the token |
| `components/forms/signin-buttons.tsx` | `signIn()` and `signOut()` with pending state |
| `app/error.tsx`, `app/blogs/error.tsx`, `app/communities/error.tsx`, `app/dashboard/error.tsx` | Error boundaries must be client components |

Helpers that these files import, such as `components/features/client-api.ts` and `components/forms/form-errors.ts`, have no directive and are bundled into them.

## Data modeling

### Embed or reference

| Model (collection) | Key fields | Decision | Why |
|---|---|---|---|
| User (`users`) | `provider`, `providerAccountId`, `name`, `email`, `image`, `username`, `bio`, `skills` (max 15), `role` | Skills embedded. Users referenced by posts, comments, communities | Skills are bounded and read with the profile. Users are shared, so posts store only a reference. Author fields are copied at read time through `populate` with a field selector that excludes `email` |
| Community (`communities`) | `name`, `slug`, `description`, `topics` (max 12), `icon`, `color`, `createdBy`, `memberCount` | Topics embedded. Members in their own collection. `memberCount` is a denormalized counter | Topics are bounded and read with the community. Members are unbounded. The counter lets lists sort and display counts without counting memberships |
| Membership (`memberships`) | `user`, `community`, `createdAt` | Own collection, referenced both ways | Membership grows without bound, and it is queried from both sides: a user's communities and whether a user is a member |
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
| `communities` | `{ name }` | No current query leads with it. The community list sorts by `memberCount`, then `name`. Candidate for removal |
| `memberships` | unique `{ user, community }` | Membership check, join and leave, duplicate-join protection |
| `memberships` | `{ community }` | Member counting in the seed script. No runtime query uses it |
| `posts` | unique `{ slug }` | Post page, edit page, slug collision check |
| `posts` | `{ community, status, publishedAt }` | Community page and `/blogs?community=`, newest first |
| `posts` | `{ author, status, publishedAt }` | Profile page, dashboard lists, `/blogs?author=` |
| `posts` | `{ status, publishedAt }` | Home latest posts and the unfiltered `/blogs` feed |
| `posts` | `{ tags, status, publishedAt }` | Topic filter (`?topic=`) and topic chips |
| `comments` | `{ post, createdAt }` | Comment list and count for a post, and removing comments with a post |
| `bookmarks` | unique `{ user, post }` | Bookmark status, toggling without duplicates |
| `bookmarks` | `{ user, createdAt }` | A user's bookmark list, newest first, and its count |

The search regex on post titles, excerpts and tags cannot use an index. The query narrows by status, community, author or tag first, then applies the regex. See Known limitations.

## API reference

All JSON endpoints return errors as `{ "error": { "message": "...", "details": ... } }`. Validation failures put `details` in the form `{ formErrors, fieldErrors }`. Any unexpected error returns 500 with `Internal server error`. Mongoose cast errors return 400.

| Method and path | Auth | Success | Error statuses |
|---|---|---|---|
| `GET /api/posts` | Optional. Drafts appear only to their author | 200, paginated `PostSummaryDTO` | Query values are lenient: bad values fall back to defaults |
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
| `GET /api/communities/[id]/membership` | Session | 200, `{ member, memberCount }` | 400, 401, 404 |
| `POST /api/communities/[id]/join` | Session | 200, `{ member: true, memberCount }` | 400, 401, 404 |
| `DELETE /api/communities/[id]/join` | Session | 200, `{ member: false, memberCount }` | 400, 401, 404 |
| `GET /api/search?q=` | Public | 200, `{ posts, communities }` | 400 when `q` is missing or not 2 to 100 characters |
| `GET /api/me` | Session | 200, `UserDTO` (includes the viewer's own email) | 401 |
| `PATCH /api/me` | Session | 200, `UserDTO` | 400, 401, 409 (username taken) |
| `GET, POST /api/auth/*` | Auth.js | Sign-in, callback, session and sign-out endpoints | Managed by Auth.js |

The bundled UI calls the write endpoints, the bookmark and membership endpoints, and `PATCH /api/me`. It does not call `GET /api/posts`, `GET /api/posts/[id]`, `GET /api/posts/[id]/comments`, `GET /api/communities`, `GET /api/search` or `GET /api/me`. Pages read those through the services on the server, so these endpoints form a JSON surface with no caller in this UI.

## Authentication and authorization

### Sign-in flow

1. "Continue with GitHub" or "Continue with Google" calls `signIn(provider, { redirectTo: callbackUrl })` (`components/forms/signin-buttons.tsx`).
2. Auth.js runs the OAuth flow and returns to `/api/auth/callback/<provider>`.
3. The `jwt` callback (`auth.ts`) runs on sign-in and calls `upsertOAuthUser` (`lib/data/users.ts`). It finds the `User` by provider and provider account id, or creates one. A new user's username comes from the GitHub login, or the email's local part, or the name, with a numeric suffix if taken. Existing users get their image and email refreshed on each sign-in.
4. The `jwt` callback stores `uid`, `username` and `role` in the token. The `session` callback copies them onto `session.user`.
5. Auth.js writes the encrypted JWT to the session cookie. There is no session table, so session validity comes from the cookie.
6. `getCurrentUser()` (`lib/auth-helpers.ts`) reads the session and then loads the `User` document for `name`, `username`, `image` and `role`. Each request loads the session user once through this function, memoized with React `cache`. A role or username change in the database therefore applies on the next request. Client islands read the token, so they update after a refresh. Saving the profile calls `update()` to refresh the token.

### Proxy and server checks

`proxy.ts` (Next.js 16 uses `proxy` in place of `middleware`) guards `/dashboard`, `/bookmarks`, `/settings`, `/create` and `/blogs/:slug/edit`. Anonymous visitors are redirected to `/signin?callbackUrl=...`. The proxy uses only `auth.config.ts`, which does not touch the database. It is an optimistic gate: it checks that a session exists, not that the user is still valid. Pages and handlers check again on the server.

### 401, 403 and 404

- **401**: there is no valid session, so the server does not know who the caller is.
- **403**: the caller is signed in, but is not allowed to do this (not the owner or an admin, or not a member of the community).
- **404**: the resource does not exist, or is a draft the viewer cannot see on a read. The edit page for another author's post renders an in-page "You can't edit this post" message with HTTP 200. It does not return 403.

### Ownership and roles

| Action | Allowed for | Enforced in |
|---|---|---|
| Read a draft | Its author, admins | `isPostVisible` in `lib/data/posts.ts` |
| Create a post | Members of the target community | `createPost` (403 otherwise) |
| Edit a post, including moving it | Author or admin; the new community also needs membership | `updatePost` with `assertCanModify` |
| Delete a post | Author or admin. Its comments and bookmarks are removed too | `deletePost` |
| Delete a comment | Comment author, post author or admin | `deleteComment` |
| Comment, bookmark | Signed-in user, on a post they can see | `createComment`, `addBookmark` |
| Join or leave a community | The signed-in user, for themselves only | `joinCommunity`, `leaveCommunity` take the session user |
| Edit profile | The signed-in user | `updateProfile` |

Hidden buttons are not security. `PostOwnerActions`, the comment delete button and the edit link only decide what to show. Anyone can send `DELETE /api/posts/<id>` directly, so the service repeats the check.

## Validation

- **Shared schemas**: `schemas/post.ts`, `schemas/comment.ts`, `schemas/profile.ts` and `schemas/query.ts` define each rule once. Client forms call `safeParse` before sending. Route handlers call `parseJson` or `parseSearchParams`, and the services receive only the parsed output.
- **Rules** (selected): post title 5 to 120 characters, excerpt up to 240, content 20 to 20,000, up to 5 tags of 2 to 30 characters (`[a-z0-9+#.-]`, lowercased, deduplicated); cover image must be an http(s) URL; comment 1 to 1,000 characters; username 3 to 30 characters of `[a-z0-9_-]`, with `admin`, `api`, `settings`, `create`, `dashboard` and `signin` reserved; up to 15 skills of up to 30 characters.
- **Lenient list queries**: `postsQuerySchema`, `communitiesQuerySchema` and `paginationQuerySchema` use `.catch()` defaults. A malformed URL renders the default view instead of an error. `searchQuerySchema` is strict because `q` has no sensible default.
- **Server errors map to fields**: a `ZodError` becomes 400 with `details.fieldErrors`. The client maps those names to the same inputs (`readFormFailure` in `components/forms/form-errors.ts`).
- **Ids**: `assertObjectId` at the service boundary returns 400 for a malformed id, rather than a cast error.
- **Markdown**: `skipHtml` drops raw HTML. External links open in a new tab with `noopener noreferrer nofollow`.

## Unhappy paths

| Situation | Handling |
|---|---|
| Loading | `loading.tsx` skeletons on `/communities`, `/blogs`, `/bookmarks` and `/dashboard`. Membership and bookmark buttons show a spinner until their status loads |
| Empty list | `EmptyState` with a next step. Filtered empty states offer "Clear filters" |
| Not found | `notFound()` renders `app/not-found.tsx` with HTTP 404. Used for unknown post, community and profile slugs, and for edit pages whose post is missing |
| Draft seen by a non-author | Public read returns 404. The edit page also returns 404 |
| Runtime error | `error.tsx` at the root and in `/blogs`, `/communities` and `/dashboard`, each with "Try again" and an error reference when Next provides one. Other routes use the root boundary |
| Validation | Client: Zod messages per field, and focus moves to the first invalid field. Server: 400 with field errors, shown on the same fields |
| Not signed in | API returns 401. Forms show "Your session has expired". Membership and bookmark buttons treat a 401 on load as signed out. Signed-out clicks go to sign-in and return to the same page |
| Not allowed | API returns 403. The edit page shows the in-page message described above |
| Network failure | Forms show a network error message. Join and bookmark roll back their optimistic state |
| Server bug | 500 `Internal server error`, logged on the server |

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

- The work is on `feature/devcommunity-capstone`, 11 commits ahead of `main`, which holds the Create Next App initial commit. A branch with the same name exists on `origin`.
- Commits are small and follow one feature area each, in dependency order: dependencies, design system and shell, models and schemas, authentication, data layer and error handling, Route Handlers, public pages, authenticated pages, seed script. Follow-up corrections are separate `fix:` commits.
- Commit messages use `feat:`, `fix:` and `chore:` prefixes.
- Secrets are not committed. `.env*` is git-ignored, and only `.env.example` is tracked. It contains names and empty values.

## Known limitations and next steps

- **Search**: post search is a case-insensitive escaped regex across title, excerpt and tags. It has no text index, so it scans the published posts that match the other filters. This is fine at the current scale. The next step is a MongoDB text index or Atlas Search.
- **Top-bar search** submits to `/blogs`, so it searches posts only, although its label says "posts and communities". `GET /api/search` searches both, but no UI calls it.
- **Member count** is a denormalized counter. Joins insert the membership first and increment only after a successful insert, so duplicate and racing requests are safe. There is no transaction, so a crash between the two writes leaves the count off. There is no reconciliation job except the seed script.
- **Comments**: the post page shows the first 50 comments, oldest first. The comments endpoint is paginated, but the UI has no "load more".
- **Drafts** cannot be previewed at their public URL. The post page reads without a viewer, so even the author gets 404 there. Drafts are reachable only through the edit page.
- **Draft existence leaks**: for a draft, a non-author gets 404 from `GET` but 403 from `PATCH` and `DELETE`, which reveals that the draft exists.
- **Accounts are not linked across providers.** A user is keyed by provider and provider account id, so a GitHub and a Google account with the same email are two users.
- **Community creation** exists only in the seed script. An admin UI is the next step.
- **Markdown** uses `react-markdown` without `remark-gfm`, so tables, strikethrough and task lists are not rendered.
- **Cover images and Markdown images** load any URL, unoptimized. Restrict the hosts if this goes beyond a demo.
- **No rate limiting** on write endpoints.
- **Bookmark deletion by post**: `deletePost` runs `Bookmark.deleteMany({ post })`, but no index leads with `post`. The unique index is `{ user, post }`. This is a cost at scale, not a correctness problem.
- **Unused code**: `data/topics.ts` is not imported anywhere, and the `{ name }` index on communities has no query behind it.
- **Bonus items** from the brief are not implemented.
- **No automated tests.** There is no test runner or test file. Checks are `npm run lint`, `npx tsc --noEmit` and manual testing.

## Technical defense cheat sheet

- **Why a Server Component?** It reads MongoDB directly through `lib/data`, adds no client JavaScript for read-only content, and can be cached. Browser-only needs move into small client islands.
- **Why `"use client"`?** Only where the file needs state, effects, event handlers, router hooks or the session. The 19 files and their reasons are in Server and client components.
- **ISR vs static vs dynamic?** Static for content with no request data (`/about`). ISR for public content that is identical for every visitor, accepting up to 60 seconds of staleness (120 for profiles) and revalidating on writes. Dynamic for anything read from `searchParams` or the session.
- **Embed vs reference?** Embed what is bounded and read together: tags (max 5), topics (max 12), skills (max 15), and the post body. Reference what grows without bound or is queried or deleted separately: comments, memberships, bookmarks. Users and communities are shared records, so they are referenced.
- **Which index helps which query?** `{ status, publishedAt }` serves the home page and the unfiltered blog feed. `{ author, status, publishedAt }` serves profiles and the dashboard. `{ post, createdAt }` serves comment lists. Unique `{ user, post }` serves bookmark status and toggles.
- **MongoDB vs Atlas vs Mongoose?** MongoDB is the document database. Atlas is MongoDB's hosted service, where the cluster, users and network rules are set. Mongoose is the ODM in the app: schemas, indexes, populate and lean queries. Zod checks requests; Mongoose checks stored data.
- **Route Handler vs direct data call?** Server Components call `lib/data` directly, with no HTTP round trip. Route Handlers exist for the client islands and other clients. Both use the same services, so the authorization rules live in one place.
- **A manual `DELETE /api/posts/<id>` of someone else's post?** No session returns 401. A signed-in non-owner gets 403 as JSON, and nothing is deleted. The comments and bookmarks stay. An admin gets 200, and the post is removed with its comments and bookmarks. An unknown id gets 404.
- **Why does the server revalidate?** Hidden buttons are only a convenience, and the service enforces the rule on every request. Separately, `revalidatePath` makes ISR pages show a change immediately instead of after the 60-second window.
- **What does Auth.js do after OAuth?** The `jwt` callback creates or updates the `User` in MongoDB and sets `uid`, `username` and `role` in the token. The `session` callback copies them into the session. Auth.js writes the encrypted session cookie and redirects to `callbackUrl`. No session is stored in the database.
- **Authentication vs authorization?** Authentication answers who is calling: a valid session, checked by `requireUser`. Authorization answers whether they may do this to that resource: `assertCanModify` and the membership checks.
- **401 vs 403?** 401 means no valid session, so the caller is unknown. 403 means the caller is known and not allowed. A missing or hidden resource is 404.
- **Localhost vs deployed?** The origin changes, so the OAuth callback URLs change, and GitHub needs a separate OAuth App. Variables move from `.env.local` to Vercel settings. `AUTH_SECRET` is required in production. Cookies are `Secure` over HTTPS. ISR behaves like production only in a build, and the database must accept connections from Vercel.
