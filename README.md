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
| 7     | Production readiness: Docker image, deployment               | doing |

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
```

Then, in two terminals:

```sh
pnpm server    # the API on http://localhost:5001/api
pnpm client    # the app on http://localhost:3000
```

The server creates the tables when it starts, see
[Running in production](#running-in-production).

Open <http://localhost:3000>. With `DEV_LOGIN=true` in `server/.env` there is a
**Dev Login** button that signs you in as a local test account, so you need no
Google credentials to try it. Search for your ScoreSaber name, pick your
profile, and add a friend on the "My hive" page.

## Commands

Run these from the repository root.

| Command              | What it does                                                         |
| -------------------- | -------------------------------------------------------------------- |
| `pnpm client`        | Start the frontend                                                   |
| `pnpm server`        | Start the API in watch mode                                          |
| `pnpm db`            | Start the database and wait until it is ready                        |
| `pnpm db:migrate`    | Apply database migrations without starting the server                |
| `pnpm app`           | Build the Docker image and run it on http://localhost:8080           |
| `pnpm app:stop`      | Stop the app started with `pnpm app`                                 |
| `pnpm api:update`    | Fetch ScoreSaber's current API description and regenerate the types  |
| `pnpm test`          | Run the tests once                                                   |
| `pnpm test:coverage` | Run the tests and report which code they do not reach                |
| `pnpm lint`          | Check the code with ESLint                                           |
| `pnpm lint:fix`      | Let ESLint fix what it can                                           |
| `pnpm typecheck`     | Type-check all packages                                              |
| `pnpm format`        | Format all files with Prettier                                       |
| `pnpm build`         | Build the frontend for production                                    |
| `pnpm ci-check`      | Run the checks of CI, in its order, and stop at the first that fails |

`pnpm ci-check` runs formatting, lint, types, the check that generated files
are up to date, the tests with their coverage thresholds, and the build. The
server tests need the database, so start `pnpm db` first. It does not build
and scan the Docker image or audit the dependencies; those run in CI only.
The name is not `ci`: `pnpm ci` is a command of pnpm itself, which deletes
`node_modules` and installs everything again.

To run a script of a single package, use a filter. This one keeps the tests
running and repeats them on every change:

```sh
pnpm --filter @beesaber/client test:watch
```

The frontend dev server runs on port 3000 and forwards requests to `/api` to the
server on port 5001.

## Checks

Checks run in three places:

| Where           | When                           | What                                                                                  |
| --------------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| Pre-commit hook | On `git commit`                | ESLint and Prettier, on the staged files                                              |
| GitHub Actions  | On pull requests and on `main` | Dependency audit, formatting, lint, types, tests, build, Docker image, security scans |
| Your terminal   | Whenever you like              | The commands above                                                                    |

The hook is installed by `pnpm install`. The workflow is defined in
`.github/workflows/ci.yml`.

The Docker job builds the image, starts it against a database and scans it
with [Trivy](https://trivy.dev/): for known vulnerabilities in the image, and
for insecure settings in the Dockerfile and the Terraform files. Serious
findings that already have a fix fail the check. The image leaves out what
running the app does not need, npm and the build tools among them, so their
vulnerabilities cannot be in it.

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
- Exactly one instance of the server may run, see
  [Running in production](#running-in-production).

## Languages

The app speaks English and German, with
[react-i18next](https://react.i18next.com/). It picks the language a visitor
chose on the landing or profile page, kept in their browser; otherwise the
first of their browser's languages it has; otherwise English.

The texts live in `client/src/i18n/`, one TypeScript file per language.
`en.ts` is the source: its keys are types, so `t('layout.dashbord')` is a
compile error. Every other language has to have exactly the same keys, or
the type check fails. Two tests add what types cannot see: a German text
that is just the English one, and a placeholder like `{{name}}` that got
lost in translation. The accessibility tests run every page in every
language.

- **A new text** goes into `en.ts` and `de.ts` under the same key, and into
  the component as `t('the.key')`. Texts with a link inside are one text
  with a tag around the linked words, rendered with `<Trans>`. Never name a
  tag after an HTML element without content, like `link` or `br`.
- **Numbers and times** go through `client/src/lib/format.ts`, which writes
  them the way the current language does.
- **Errors from the server** are shown by their code (`errors.api` in
  `en.ts`); a new code in `server/src/http/errors.ts` needs a text there.
- **A new language** is a new file typed as `Translation`, added to
  `LANGUAGES` and `resources` in `i18n.ts` and to the names in
  `LanguageSwitch.tsx`.

## Running in production

The `Dockerfile` builds one image that holds the whole app: the API, the built
frontend and the database migrations. One Node process serves both under one
address, which the session cookie and the absence of CORS headers rely on.
Requests under `/api` go to the API; any other address gets the frontend, and
React draws the page it asks for.

The image holds no build tools and no tests, and never a `.env` file. It runs
as the unprivileged `node` user.

When the server starts, it applies the database migrations the database has
not seen yet, before it does anything else. If they fail, it stops instead of
running against the wrong tables. Two processes that start at once take turns.

To try the image on your machine, with the settings from `server/.env` and the
development database:

```sh
pnpm db        # if it is not running yet
pnpm app       # builds the image and starts it on http://localhost:8080
pnpm app:stop
```

The image is a production build, so it has no dev login. To sign in with
Google, add `http://localhost:8080/api/auth/callback/google` to the redirect
URIs of your OAuth client.

How BeeSaber runs on Azure, and how to set that up, is described in
[infra/README.md](infra/README.md).

### Settings

What has to be set where the image runs:

| Variable                                   | In production                                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                             | The connection string of the production database                                                                                                                    |
| `DATABASE_IDENTITY_CLIENT_ID`              | In Azure: the client id of the app's managed identity. The server then signs in to the database with its tokens, and `DATABASE_URL` holds no password               |
| `APP_URL`                                  | The address people open, with `https`. Sign-in redirects go there, and only this site may send forms to the API                                                     |
| `AUTH_SECRET`                              | A secret of its own, at least 32 characters, never the one from development. Whoever knows it can forge a session                                                   |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | An OAuth client with `<APP_URL>/api/auth/callback/google` among its redirect URIs                                                                                   |
| `TRUST_PROXY`                              | `true` when a reverse proxy or a platform's ingress stands in front and sets `X-Forwarded-For`. Without it, the rate limit counts every visitor as the same address |
| `PORT`                                     | `5001`, unless the platform needs another                                                                                                                           |
| `DEV_LOGIN`                                | Leave unset. The server refuses to start with it unless `APP_URL` is localhost                                                                                      |

`FRONTEND_DIR` and `NODE_ENV` are set by the image. `/api/health` answers
`ok` when the server runs and reaches the database, for health checks and
uptime monitors.

### One instance

The rate limits count in the memory of the process, and the job queue and the
live feed run inside it. Two instances would each allow the full number of
requests and each open a connection to the live feed. Run exactly one.

## The API

All paths start with `/api`. Everything except `/health`, `/config` and `/auth` needs a
session and answers `401` without one. The hive routes also need a linked
ScoreSaber profile and answer `409` until one is picked. Errors always look like
`{ "error": { "code": "not_in_hive", "message": "..." } }`. The codes are listed
in `server/src/http/errors.ts`; the message is English and meant for logs. The
frontend shows a text of its own for each code, in the visitor's language
(`errors.api` in `client/src/i18n/en.ts`).

### Accounts and profiles

An account is who you are in BeeSaber: you sign in with Google and get a
session cookie. A profile is the ScoreSaber player you compare as; you pick it
once after signing in. Nothing proves the profile is yours, and nothing needs
to: all it exposes is public ScoreSaber data. Your hive belongs to your
account, so two accounts with the same profile still have a hive each.

Deleting an account removes the account, its sessions, its link to Google and
its hive. Players and their scores stay: they are public ScoreSaber data, and
other accounts may follow the same players.

| Method and path                  | What it does                                          |
| -------------------------------- | ----------------------------------------------------- |
| `GET /health`                    | Is the server up and can it reach the database        |
| `GET /config`                    | Which ways to sign in are switched on                 |
| `GET /players/search?q=`         | Find players on ScoreSaber by name                    |
| `GET /players/:id/scores`        | A player's scores, in pages; `sort`, `search`         |
| `GET`, `POST /auth/*`            | Sign-in, callback and sign-out, by Better Auth        |
| `GET /me`                        | My account and my ScoreSaber profile                  |
| `DELETE /me`                     | Delete my account, its sessions and its hive          |
| `PUT /me/player`                 | Pick the ScoreSaber profile I compare as              |
| `GET /hive`                      | My bees, each with the head-to-head record            |
| `POST /hive`                     | Add a player to my hive                               |
| `DELETE /hive/:playerId`         | Remove a player from my hive                          |
| `GET /hive/:playerId/comparison` | Maps we both played, with both scores; `filter`       |
| `GET /hive/maps/:leaderboardId`  | Me and my bees on one map, best score first           |
| `GET /hive/revenge`              | Maps where a bee is ahead of me, closest first; `bee` |
| `GET /hive/trending`             | Maps bees played in the last 14 days that I have not  |
| `GET /hive/news`                 | Scores of bees that went past mine                    |
| `POST /hive/sync`                | Queue a fetch of new scores, mine and my bees'        |
| `GET /hive/sync`                 | Whose scores are being fetched right now              |

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

Every Monday the workflow `ScoreSaber API`
(`.github/workflows/scoresaber-api.yml`) does this on GitHub. If an endpoint
changed, it opens a pull request with the new copy, the list of changes and
whether `pnpm typecheck` still passes. It can also be started by hand in the
Actions tab.

GitHub starts no workflows for a pull request that a workflow opened, so CI
and the review do not run on it by themselves: close and reopen it once.

## Dependency install scripts

pnpm does not run install scripts of dependencies unless they are allowed.
Every decision is recorded under `allowBuilds` in `pnpm-workspace.yaml`. When a
new dependency asks to run a script, `pnpm install` fails and names it; allow or
deny it with:

```sh
pnpm approve-builds
```
