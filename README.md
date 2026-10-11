# BeeSaber Reloaded

Compare your [Beat Saber](https://beatsaber.com/) scores with your friends.
Sign in, link your [ScoreSaber](https://scoresaber.com/) profile and add other
players as "bees" to your "hive". BeeSaber then shows which songs you have both
played and who scored higher.

## Status

The project was built in 2021/22 and is being modernised step by step. **It runs
end to end on a developer's machine**: sign in, pick your ScoreSaber profile,
add friends to your hive and compare scores. New scores arrive when you press
"Sync scores"; fetching them in the background is the next step.

| Phase | Content                                                      | State   |
| ----- | ------------------------------------------------------------ | ------- |
| 0     | pnpm workspaces, `client/` `server/` `shared/`               | done    |
| 1     | Vite instead of Create React App                             | done    |
| 2     | Vitest, ESLint, Prettier 3, CI                               | done    |
| 3     | New backend: Hono, Postgres, Drizzle, current ScoreSaber API | done    |
| 4     | Sign-in with Google, accounts and sessions                   | done    |
| 5     | New frontend with Tailwind and react-router on the new API   | done    |
| 6     | Background jobs: live score feed, sync without waiting       | next    |
| 7     | Production readiness: Docker image, deployment               | planned |

## Structure

This is a [pnpm workspace](https://pnpm.io/workspaces) with two packages:

| Folder    | Package            | Content                                   |
| --------- | ------------------ | ----------------------------------------- |
| `client/` | `@beesaber/client` | Frontend: React, Tailwind, TanStack Query |
| `server/` | `@beesaber/server` | API: Hono, Drizzle, Postgres, Better Auth |

The client imports the _types_ of the server's routes (`AppType`) and builds
its API client from them. A call to a path that does not exist, or a read of a
field the server does not send, fails the type check. No server code ends up
in the browser.

## Prerequisites

- [Node.js](https://nodejs.org/) 24 (see `.nvmrc`)
- pnpm, provided by Corepack which ships with Node:

  ```sh
  corepack enable pnpm
  ```

  If that fails with `EPERM` on Windows, let Corepack put the launchers into a
  folder of your user profile that is already on the `PATH`:

  ```powershell
  corepack enable pnpm --install-directory "$env:APPDATA\npm"
  ```

- [Docker Desktop](https://www.docker.com/products/docker-desktop/), for the
  database of the API and its tests

## Getting started

```sh
pnpm install
pnpm db                             # start Postgres in Docker
cp server/.env.example server/.env  # then set AUTH_SECRET, see the comments in the file
pnpm db:migrate                     # create the tables
```

Then, in two terminals:

```sh
pnpm server    # the API on http://localhost:5001/api
pnpm client    # the app on http://localhost:3000
```

Open <http://localhost:3000>. With `DEV_LOGIN=true` in `server/.env` there is a
**Dev Login** button that signs you in as a local test account, so you need no
Google credentials to try it. Search for your ScoreSaber name, pick your
profile, and add a friend on the "My hive" page.

## Commands

Run these from the repository root.

| Command           | What it does                                  |
| ----------------- | --------------------------------------------- |
| `pnpm client`     | Start the frontend                            |
| `pnpm server`     | Start the API in watch mode                   |
| `pnpm db`         | Start the database and wait until it is ready |
| `pnpm db:migrate` | Apply database migrations                     |
| `pnpm test`       | Run the tests once                            |
| `pnpm lint`       | Check the code with ESLint                    |
| `pnpm lint:fix`   | Let ESLint fix what it can                    |
| `pnpm typecheck`  | Type-check all packages                       |
| `pnpm format`     | Format all files with Prettier                |
| `pnpm build`      | Build all packages                            |

To run a script of a single package, use a filter. This one keeps the tests
running and repeats them on every change:

```sh
pnpm --filter @beesaber/client test:watch
```

The frontend dev server runs on port 3000 and forwards requests to `/api` to the
server on port 5001.

## Checks

Checks run in three places:

| Where           | When                           | What                                     |
| --------------- | ------------------------------ | ---------------------------------------- |
| Pre-commit hook | On `git commit`                | ESLint and Prettier, on the staged files |
| GitHub Actions  | On pull requests and on `main` | Formatting, lint, types, tests, build    |
| Your terminal   | Whenever you like              | The commands above                       |

The hook is installed by `pnpm install`. The workflow is defined in
`.github/workflows/ci.yml`.

Tests are written with [Vitest](https://vitest.dev/) and
[Testing Library](https://testing-library.com/) and live next to the code they
test as `*.test.ts(x)`.

The frontend tests render the whole app and use it like a person would. Its
API calls are answered by a fake built with [msw](https://mswjs.io/)
(`client/src/testing/fakeApi.ts`); the fake's answers are typed with the real
server's types, so it cannot drift from the API unnoticed.

The server tests run against a real Postgres, in a database of their own
(`beesaber_test`), so `pnpm db` has to be running. ScoreSaber is replaced by a
small fake built from real answers.

### Known limitations

- New scores only arrive when someone presses "Sync scores". Phase 6 changes
  that.
- Adding a player with thousands of scores keeps the request open until all of
  them are fetched, about 20 seconds for 3600 scores.
- Sign-in with Google needs your own OAuth client, see `server/.env.example`.
  It has not been tested against Google yet.
- Nothing proves that the ScoreSaber profile you pick is yours. ScoreSaber
  offers sign-in for third-party apps only to approved developers.

## The API

All paths start with `/api`. Everything except `/health` and `/auth` needs a
session and answers `401` without one. The hive routes also need a linked
ScoreSaber profile and answer `409` until one is picked. Errors always look like
`{ "error": { "code": "not_found", "message": "..." } }`.

### Accounts and profiles

An account is who you are in BeeSaber: you sign in with Google and get a
session cookie. A profile is the ScoreSaber player you compare as; you pick it
once after signing in. Nothing proves the profile is yours, and nothing needs
to: all it exposes is public ScoreSaber data. Your hive belongs to your
account, so two accounts with the same profile still have a hive each.

| Method and path                  | What it does                                    |
| -------------------------------- | ----------------------------------------------- |
| `GET /health`                    | Is the server up and can it reach the database  |
| `GET /players/search?q=`         | Find players on ScoreSaber by name              |
| `GET /players/:id`               | A player's profile                              |
| `GET /players/:id/scores`        | A player's scores, in pages; `sort`, `search`   |
| `POST /players/:id/sync`         | Fetch new scores of a player from ScoreSaber    |
| `GET`, `POST /auth/*`            | Sign-in, callback and sign-out, by Better Auth  |
| `GET /me`                        | My account and my ScoreSaber profile            |
| `PUT /me/player`                 | Pick the ScoreSaber profile I compare as        |
| `GET /hive`                      | My bees, each with the head-to-head record      |
| `POST /hive`                     | Add a player to my hive                         |
| `DELETE /hive/:playerId`         | Remove a player from my hive                    |
| `GET /hive/:playerId/comparison` | Maps we both played, with both scores; `filter` |
| `GET /hive/news`                 | Scores of bees that went past mine              |
| `POST /hive/sync`                | Fetch new scores for me and all my bees         |

### Security

What the server does to stay safe, and where:

| Risk                              | Protection                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------- |
| SQL injection                     | All queries go through Drizzle, which sends values separately from SQL          |
| Malformed or hostile input        | Every route validates its input with zod before anything else runs              |
| Stolen or forged sessions         | Random session tokens in `HttpOnly`, `SameSite=Lax` cookies, stored in Postgres |
| Requests forged by other websites | Origin check for form requests; no CORS headers, so answers stay private        |
| Reading or changing others' data  | Hive routes take the user from the session, never from the URL                  |
| Flooding                          | 120 requests per minute per account, body limit of 100 kB                       |
| Abusing us to hammer ScoreSaber   | A player is synced at most once a minute; hives hold at most 50 bees            |
| Leaking internals                 | Errors return a code and a message, details only go to the server log           |
| Vulnerable dependencies           | `pnpm audit` in CI, Dependabot, install scripts blocked by default              |
| Leaked secrets                    | Secrets only in `server/.env`, which git ignores; checked at startup            |

`server/src/security.test.ts` plays the attacker for most of these rows.

### How the server is organised

| Folder                  | Content                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `server/src/db`         | Schema, connection, migration runner                        |
| `server/src/auth`       | Sign-in and sessions with Better Auth                       |
| `server/src/me`         | The signed-in user and their profile                        |
| `server/src/scoresaber` | Client for the ScoreSaber API and the mapping to our tables |
| `server/src/players`    | Players and scores: routes, service, repository             |
| `server/src/hive`       | Hives and comparisons: routes, service, repository          |
| `server/src/http`       | Error format, request validation, session check             |
| `server/drizzle`        | Generated SQL migrations                                    |

A request passes through three layers. The **route** reads and validates it,
the **service** decides what has to happen, the **repository** runs the SQL.

### Changing the database

Edit `server/src/db/schema.ts`, then:

```sh
pnpm --filter @beesaber/server db:generate   # writes a migration to server/drizzle
pnpm db:migrate                              # applies it
```

Commit the generated migration together with the schema change.

### Keeping up with ScoreSaber

`server/src/scoresaber/openapi.json` is a copy of
<https://scoresaber.com/api/openapi.json>. The types in `openapi.d.ts` are
generated from it. To pick up changes, replace the copy and run:

```sh
pnpm --filter @beesaber/server gen:api
```

The diff of the two files shows what ScoreSaber changed.

## Dependency install scripts

pnpm does not run install scripts of dependencies unless they are allowed.
Every decision is recorded under `allowBuilds` in `pnpm-workspace.yaml`. When a
new dependency asks to run a script, `pnpm install` fails and names it; allow or
deny it with:

```sh
pnpm approve-builds
```
