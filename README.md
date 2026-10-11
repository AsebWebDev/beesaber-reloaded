# BeeSaber Reloaded

Compare your [Beat Saber](https://beatsaber.com/) scores with your friends.
Sign in, link your [ScoreSaber](https://scoresaber.com/) profile and add other
players as "bees" to your "hive". BeeSaber then shows which songs you have both
played and who scored higher.

## Status

The project was built in 2021/22 and is being modernised step by step. **The
frontend runs, but only against mocked API responses**: the old server is broken
until phase 3 replaces it, and real sign-in comes with phase 4.

| Phase | Content                                                      | State   |
| ----- | ------------------------------------------------------------ | ------- |
| 0     | pnpm workspaces, `client/` `server/` `shared/`               | done    |
| 1     | Vite instead of Create React App                             | done    |
| 2     | Vitest, ESLint 9, Prettier 3, CI                             | next    |
| 3     | New backend: Hono, Postgres, Drizzle, current ScoreSaber API | planned |
| 4     | Better Auth with Google, react-router 7                      | planned |
| 5     | Tailwind instead of styled-components and MDB                | planned |
| 6     | Production readiness: Docker image, deployment               | planned |

## Structure

This is a [pnpm workspace](https://pnpm.io/workspaces) with three packages:

| Folder    | Package            | Content                                         |
| --------- | ------------------ | ----------------------------------------------- |
| `client/` | `@beesaber/client` | React frontend                                  |
| `server/` | `@beesaber/server` | API                                             |
| `shared/` | `@beesaber/shared` | TypeScript types used by both client and server |

Client and server import the shared types like any other package:

```ts
import type { Bee } from '@beesaber/shared';
```

## Prerequisites

- [Node.js](https://nodejs.org/) 24 (see `.nvmrc`)
- pnpm, provided by Corepack which ships with Node:

  ```sh
  corepack enable pnpm
  ```

  If that fails with `EPERM` on Windows, let Corepack put the launchers into a
  folder of your user profile that is already on the `PATH`:

  ```powershell
  corepack enable pnpm --install-directory "$env:APPDATA
  pm"
  ```

- [Docker Desktop](https://www.docker.com/products/docker-desktop/), needed from
  phase 3 on for the database

## Getting started

```sh
pnpm install
pnpm client:mock
```

Then open <http://localhost:3000> and click **Dev Login**. Mock mode answers all
API calls with example data from `client/src/testing/testData`, so neither a
server nor a Google account is needed.

## Commands

Run these from the repository root.

| Command            | What it does                                    |
| ------------------ | ----------------------------------------------- |
| `pnpm client:mock` | Start the frontend against mocked API responses |
| `pnpm client`      | Start the frontend against the real API         |
| `pnpm server`      | Start the API in watch mode                     |
| `pnpm typecheck`   | Type-check all packages                         |
| `pnpm build`       | Build all packages                              |
| `pnpm format`      | Format all files with Prettier                  |

To run a script of a single package, use a filter:

```sh
pnpm --filter @beesaber/client typecheck
```

The frontend dev server runs on port 3000 and forwards requests to `/api` to the
server on port 5001.

### Known limitations

Until phase 3 and phase 4 are done, expect these:

- `pnpm server` needs a MongoDB and calls a ScoreSaber API host that no longer
  exists. `pnpm client` is therefore of little use for now.
- Sign-in with Google does not work, the library behind it was shut down. Mock
  mode replaces it with the Dev Login button.
- `pnpm typecheck` passes for `client` and `shared` and reports three errors in
  `server`.
- Player avatars and some song covers do not load in mock mode, the example data
  points to files that do not exist.

## Dependency install scripts

pnpm does not run install scripts of dependencies unless they are allowed.
Every decision is recorded under `allowBuilds` in `pnpm-workspace.yaml`. When a
new dependency asks to run a script, `pnpm install` fails and names it; allow or
deny it with:

```sh
pnpm approve-builds
```
