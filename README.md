# BeeSaber Reloaded

Compare your [Beat Saber](https://beatsaber.com/) scores with your friends.
Sign in, link your [ScoreSaber](https://scoresaber.com/) profile and add other
players as "bees" to your "hive". BeeSaber then shows which songs you have both
played and who scored higher.

## Status

The project was built in 2021/22 and is being modernised step by step. **The
new API and the frontend both run, but are not connected yet**: the API fetches
real data from ScoreSaber, while the frontend still shows mocked responses.
Phase 4 connects the two and adds sign-in.

| Phase | Content                                                      | State   |
| ----- | ------------------------------------------------------------ | ------- |
| 0     | pnpm workspaces, `client/` `server/` `shared/`               | done    |
| 1     | Vite instead of Create React App                             | done    |
| 2     | Vitest, ESLint, Prettier 3, CI                               | done    |
| 3     | New backend: Hono, Postgres, Drizzle, current ScoreSaber API | done    |
| 4     | Sign in with ScoreSaber, frontend on the new API, router 7   | next    |
| 5     | Tailwind instead of styled-components and MDB                | planned |
| 6     | Production readiness: Docker image, deployment               | planned |

## Structure

This is a [pnpm workspace](https://pnpm.io/workspaces) with three packages:

| Folder    | Package            | Content                                        |
| --------- | ------------------ | ---------------------------------------------- |
| `client/` | `@beesaber/client` | React frontend                                 |
| `server/` | `@beesaber/server` | API: Hono, Drizzle, Postgres                   |
| `shared/` | `@beesaber/shared` | Types of the old API, still used by the client |

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
```

### Frontend

```sh
pnpm client:mock
```

Then open <http://localhost:3000> and click **Dev Login**. Mock mode answers all
API calls with example data from `client/src/testing/testData`, so neither the
API nor an account is needed.

### API

```sh
pnpm db                             # start Postgres in Docker
cp server/.env.example server/.env  # then set DEV_PLAYER_ID to your ScoreSaber id
pnpm db:migrate                     # create the tables
pnpm server                         # http://localhost:5001/api
```

Try it:

```sh
curl http://localhost:5001/api/health
curl http://localhost:5001/api/me
```

The first call to `/api/me` fetches your profile and all your scores from
ScoreSaber.

## Commands

Run these from the repository root.

| Command            | What it does                                    |
| ------------------ | ----------------------------------------------- |
| `pnpm client:mock` | Start the frontend against mocked API responses |
| `pnpm client`      | Start the frontend against the real API         |
| `pnpm server`      | Start the API in watch mode                     |
| `pnpm db`          | Start the database and wait until it is ready   |
| `pnpm db:migrate`  | Apply database migrations                       |
| `pnpm test`        | Run the tests once                              |
| `pnpm lint`        | Check the code with ESLint                      |
| `pnpm lint:fix`    | Let ESLint fix what it can                      |
| `pnpm typecheck`   | Type-check all packages                         |
| `pnpm format`      | Format all files with Prettier                  |
| `pnpm build`       | Build all packages                              |

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
test as `*.test.ts(x)`. API calls are answered by the same
[msw](https://mswjs.io/) handlers that drive mock mode; a request without a
handler fails the test.

The server tests run against a real Postgres, in a database of their own
(`beesaber_test`), so `pnpm db` has to be running. ScoreSaber is replaced by a
small fake built from real answers.

### Known limitations

Until phase 4 and phase 5 are done, expect these:

- The frontend does not talk to the new API yet. `pnpm client` without mock
  mode is therefore of little use for now.
- There is no sign-in. The API treats every request as coming from the player
  in `DEV_PLAYER_ID`; the frontend has a Dev Login button in mock mode.
- Adding a player with thousands of scores keeps the request open until all of
  them are fetched, about 20 seconds for 3600 scores.
- `pnpm lint` reports warnings in components that are due to be rewritten in
  phase 5.
- Player avatars and some song covers do not load in mock mode, the example data
  points to files that do not exist.

## The API

All paths start with `/api`. Errors always look like
`{ "error": { "code": "not_found", "message": "..." } }`.

| Method and path                  | What it does                                    |
| -------------------------------- | ----------------------------------------------- |
| `GET /health`                    | Is the server up and can it reach the database  |
| `GET /players/search?q=`         | Find players on ScoreSaber by name              |
| `GET /players/:id`               | A player's profile                              |
| `GET /players/:id/scores`        | A player's scores, in pages; `sort`, `search`   |
| `POST /players/:id/sync`         | Fetch new scores of a player from ScoreSaber    |
| `GET /me`                        | The profile of the player making the request    |
| `GET /hive`                      | My bees, each with the head-to-head record      |
| `POST /hive`                     | Add a player to my hive                         |
| `DELETE /hive/:playerId`         | Remove a player from my hive                    |
| `GET /hive/:playerId/comparison` | Maps we both played, with both scores; `filter` |
| `GET /hive/news`                 | Scores of bees that went past mine              |
| `POST /hive/sync`                | Fetch new scores for me and all my bees         |

### How the server is organised

| Folder                  | Content                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `server/src/db`         | Schema, connection, migration runner                        |
| `server/src/scoresaber` | Client for the ScoreSaber API and the mapping to our tables |
| `server/src/players`    | Players and scores: routes, service, repository             |
| `server/src/hive`       | Hives and comparisons: routes, service, repository          |
| `server/src/http`       | Error format, request validation, who is asking             |
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
