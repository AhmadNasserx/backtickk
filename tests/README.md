# Tests

Automated tests for Backtickk's critical business rules: post authorization and drafts, membership counts,
bookmarks and comments, query and input validation, and user sign-in and profile rules.

## Running

```bash
npm test             # run once (vitest run)
npm run test:watch   # watch mode
```

No separate database is needed. Integration tests start an in-memory MongoDB per file.

### MongoDB binary

`mongodb-memory-server` downloads a `mongod` binary on the first run and caches it under
`node_modules/.cache/mongodb-memory-server`. Any environment with network access does this automatically,
including CI, so no setup is needed.

To use a local binary instead (offline machines, or to skip the download), set `MONGOMS_SYSTEM_BINARY`
to the binary's path for that shell or job. Do not commit a path to the repo.

## Layout

| File | Kind | Covers |
| --- | --- | --- |
| `schemas.test.ts` | pure | Post, comment and profile input rules, tag and skill normalisation, reserved usernames, lenient list queries, strict `q` in search |
| `lib-utils.test.ts` | pure | `slugify`, `readingTime`, `escapeRegex`, `canModify` / `assertCanModify`, `route()` error mapping, query and JSON parsing |
| `authorization.test.ts` | integration | Community membership gate for posting, owner/admin/other rules for edits, deletes and comment deletes, draft visibility, `publishedAt` lifecycle |
| `communities.test.ts` | integration | Idempotent join and leave, concurrent joins and leaves, `memberCount` consistency, community search and pagination, member listing (no email) |
| `posts-query.test.ts` | integration | Post listing filters, sort and pagination, regex-safe search, bookmarks, comment pagination |
| `users.test.ts` | integration | OAuth first sign-in and returning sign-in, username generation, `ADMIN_EMAILS` promotion, profile conflicts, public profile privacy |

`setup/` holds shared helpers, not test files:

- `setup/db.ts`: starts and stops the in-memory server, clears collections between tests, and provides
  fixture factories (`makeUser`, `makeCommunity`, `makeMembership`, `makePost`, `makeComment`, `makeBookmark`)
  that write through the real Mongoose models.
- `setup/assertions.ts`: `expectStatus` checks that a service call throws an `AppError` with a given status.
- `setup/auth-mock.ts`: replaces `@/auth` for every file. The data layer receives the viewer as a `SessionUser`,
  and the real Auth.js module cannot load under Node.

## Not covered

Route handlers, React components, the Auth.js sign-in flow and the seed script. The data layer is tested
directly, and `route()` is tested with synthetic handlers.
