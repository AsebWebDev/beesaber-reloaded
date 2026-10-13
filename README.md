# BeeSaber Reloaded

Compare your [Beat Saber](https://beatsaber.com/) scores with your friends.
Sign in, link your [ScoreSaber](https://scoresaber.com/) profile and add other
players as "bees" to your "hive". BeeSaber then shows which songs you have both
played and who scored higher.

## Status

The project was built in 2021/22 and is being modernised step by step. **It runs
end to end on a developer's machine**: sign in, pick your ScoreSaber profile,
add friends to your hive and compare scores. New scores of your friends arrive
by themselves, usually within a minute of being set.

| Phase | Content                                                      | State |
| ----- | ------------------------------------------------------------ | ----- |
| 0     | pnpm workspaces, `client/` and `server/`                     | done  |
| 1     | Vite instead of Create React App                             | done  |
| 2     | Vitest, ESLint, Prettier 3, CI                               | done  |
| 3     | New backend: Hono, Postgres, Drizzle, current ScoreSaber API | done  |
| 4     | Sign-in with Google, accounts and sessions                   | done  |
| 5     | New frontend with Tailwind and react-router on the new API   | done  |
| 6     | Background jobs: live score feed, sync without waiting       | done  |
| 7     | Production readiness: Docker image, deployment               | next  |

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

| Command              | What it does                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `pnpm client`        | Start the frontend                                                  |
| `pnpm server`        | Start the API in watch mode                                         |
| `pnpm db`            | Start the database and wait until it is ready                       |
| `pnpm db:migrate`    | Apply database migrations                                           |
| `pnpm api:update`    | Fetch ScoreSaber's current API description and regenerate the types |
| `pnpm test`          | Run the tests once                                                  |
| `pnpm test:coverage` | Run the tests and report which code they do not reach               |
| `pnpm lint`          | Check the code with ESLint                                          |
| `pnpm lint:fix`      | Let ESLint fix what it can                                          |
| `pnpm typecheck`     | Type-check all packages                                             |
| `pnpm format`        | Format all files with Prettier                                      |
| `pnpm build`         | Build the frontend for production                                   |

To run a script of a single package, use a filter. This one keeps the tests
running and repeats them on every change:

```sh
pnpm --filter @beesaber/client test:watch
```

The frontend dev server runs on port 3000 and forwards requests to `/api` to the
server on port 5001.

## Checks

Checks run in three places:

| Where           | When                           | What                                                    |
| --------------- | ------------------------------ | ------------------------------------------------------- |
| Pre-commit hook | On `git commit`                | ESLint and Prettier, on the staged files                |
| GitHub Actions  | On pull requests and on `main` | Dependency audit, formatting, lint, types, tests, build |
| Your terminal   | Whenever you like              | The commands above                                      |

The hook is installed by `pnpm install`. The workflow is defined in
`.github/workflows/ci.yml`.

Tests are written with [Vitest](https://vitest.dev/) and
[Testing Library](https://testing-library.com/) and live next to the code they
test as `*.test.ts(x)`.

The frontend tests render the whole app and use it like a person would. Its
API calls are answered by a fake built with [msw](https://mswjs.io/)
(`client/src/testing/fakeApi.ts`); the fake's answers are typed with the real
server's types, so a renamed or missing field in them fails the type check.
Paths, status codes and the behaviour on errors are not checked that way.

The server tests run against a real Postgres, in a database of their own
(`beesaber_test`), so `pnpm db` has to be running. ScoreSaber is replaced by a
small fake built from real answers.

### Known limitations

- Sign-in with Google needs your own OAuth client, see `server/.env.example`.
- Nothing proves that the ScoreSaber profile you pick is yours. ScoreSaber
  offers sign-in for third-party apps only to approved developers.
- The job queue and the live feed run inside the API process. That is fine for
  one instance; several instances would each open their own feed connection.

## The API

All paths start with `/api`. Everything except `/health`, `/config` and `/auth` needs a
session and answers `401` without one. The hive routes also need a linked
ScoreSaber profile and answer `409` until one is picked. Errors always look like
`{ "error": { "code": "not_found", "message": "..." } }`.

### Accounts and profiles

An account is who you are in BeeSaber: you sign in with Google and get a
session cookie. A profile is the ScoreSaber player you compare as; you pick it
once after signing in. Nothing proves the profile is yours, and nothing needs
to: all it exposes is public ScoreSaber data. Your hive belongs to your
account, so two accounts with the same profile still have a hive each.

Deleting an account removes the account, its sessions, its link to Google and
its hive. Players and their scores stay: they are public ScoreSaber data, and
other accounts may follow the same players.

| Method and path                  | What it does                                    |
| -------------------------------- | ----------------------------------------------- |
| `GET /health`                    | Is the server up and can it reach the database  |
| `GET /config`                    | Which ways to sign in are switched on           |
| `GET /players/search?q=`         | Find players on ScoreSaber by name              |
| `GET /players/:id/scores`        | A player's scores, in pages; `sort`, `search`   |
| `GET`, `POST /auth/*`            | Sign-in, callback and sign-out, by Better Auth  |
| `GET /me`                        | My account and my ScoreSaber profile            |
| `DELETE /me`                     | Delete my account, its sessions and its hive    |
| `PUT /me/player`                 | Pick the ScoreSaber profile I compare as        |
| `GET /hive`                      | My bees, each with the head-to-head record      |
| `POST /hive`                     | Add a player to my hive                         |
| `DELETE /hive/:playerId`         | Remove a player from my hive                    |
| `GET /hive/:playerId/comparison` | Maps we both played, with both scores; `filter` |
| `GET /hive/news`                 | Scores of bees that went past mine              |
| `POST /hive/sync`                | Queue a fetch of new scores, mine and my bees'  |
| `GET /hive/sync`                 | Whose scores are being fetched right now        |

### How scores get here

Fetching a player's scores can take dozens of requests to ScoreSaber, far too
long to keep a browser waiting. So requests never fetch scores themselves.
They put a **job** on a queue and answer at once; a worker does the fetching.
The queue is [pg-boss](https://github.com/timgit/pg-boss), which stores jobs
in the Postgres we already have, so they survive a restart and failed ones are
retried.

Three things put jobs on the queue:

| Source               | When                                                             |
| -------------------- | ---------------------------------------------------------------- |
| A user               | Picking a profile, adding a bee, pressing "Sync scores"          |
| ScoreSaber live feed | A player in someone's hive, or a linked profile, sets a score    |
| A timer              | Every 15 minutes, for tracked players not fetched for 30 minutes |

The live feed is a WebSocket on which ScoreSaber announces every new score
worldwide. The server only reads whose score it is and, if somebody here
follows that player, queues a fetch 40 seconds later; ScoreSaber's own score
lists lag behind the feed by up to half a minute. The feed is not documented
and goes down now and then, which is what the timer is for. A connection that
stays silent for five minutes is taken for dead and replaced. Set
`LIVE_FEED=false` in `server/.env` to run without it.

When jobs pile up, those a user is waiting for run first, then those from the
live feed, then the timer's.

While a fetch is queued or running, the player has `syncStartedAt` set. The
frontend shows "fetching" and asks `GET /hive/sync` until it is done: every
1.5 seconds at first, less often the longer it takes.

### Talking to ScoreSaber

ScoreSaber allows 25 requests a second. All requests go through a throttle
that sends them one after the other with a pause in between, gives up on a
request after 15 seconds without an answer, and waits when ScoreSaber says
"too many requests". There are two such lanes: one for the long score lists
that background jobs read, one for everything a user waits for, so a big
fetch cannot hold up a search.

### What counts as news

"A bee beat your score" is derived from a log of score changes
(`score_events`), written whenever a sync finds a new or improved score. Three
rules keep it honest:

- The first sync of a player logs nothing. Those scores are history.
- Only what a bee did after joining your hive is news to you, however long
  someone else has been tracking that bee.
- A report disappears once you have taken the lead back, and it shows what the
  bee holds now, not what they held when they passed you.

Scores are read from ScoreSaber by time, not by page number, because the list
shifts while it is being read. A stored score is never replaced by a worse
one, and a play can only be logged once, whatever overlaps or retries happen.
A player whose sync keeps failing is tried again after half an hour, then an
hour, doubling up to once a day.

### Security

What the server does to stay safe, and where:

| Risk                              | Protection                                                                                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL injection                     | All queries go through Drizzle, which sends values separately from SQL                                                                                                                                                                |
| Malformed or hostile input        | Every route validates its input with zod before anything else runs                                                                                                                                                                    |
| Stolen or forged sessions         | Random session tokens in `HttpOnly`, `SameSite=Lax` cookies, stored in Postgres                                                                                                                                                       |
| Requests forged by other websites | Origin check for form requests; no CORS headers, so answers stay private                                                                                                                                                              |
| Reading or changing others' data  | Hive routes take the user from the session, never from the URL                                                                                                                                                                        |
| Flooding                          | Per account: 120 requests a minute. Per address on the routes without a session: 60 a minute. Body limit of 100 kB                                                                                                                    |
| Abusing us to hammer ScoreSaber   | No route fetches a player by id. Players only enter by being picked as a profile or added to a hive, 30 times an hour per account at most. 30 searches a minute. A player is synced at most once a minute; hives hold at most 50 bees |
| Leaking internals                 | Errors return a code and a message. A failed sync is stored as a code. Details only go to the server log                                                                                                                              |
| Opening up by misconfiguration    | Password accounts (`DEV_LOGIN`) and plain http are refused unless `APP_URL` is localhost, whatever `NODE_ENV` says. The dev login is not part of production builds of the frontend                                                    |
| Vulnerable dependencies           | `pnpm audit` in CI, Dependabot, install scripts blocked by default                                                                                                                                                                    |
| Leaked secrets                    | Secrets only in `server/.env`, which git ignores; checked at startup                                                                                                                                                                  |

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
| `server/src/jobs`       | The job queue for work outside of requests                  |
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
generated from it. To pick up changes, run:

```sh
pnpm api:update
```

It lists added, removed and changed endpoints and points out changes to the
ones the server uses. The diff of the two files shows the details.

## Dependency install scripts

pnpm does not run install scripts of dependencies unless they are allowed.
Every decision is recorded under `allowBuilds` in `pnpm-workspace.yaml`. When a
new dependency asks to run a script, `pnpm install` fails and names it; allow or
deny it with:

```sh
pnpm approve-builds
```
