# BeeSaber Reloaded

Compare your [Beat Saber](https://beatsaber.com/) scores with your friends.
Sign in, link your [ScoreSaber](https://scoresaber.com/) profile and add other
players as "bees" to your "hive". BeeSaber then shows which songs you have both
played and who scored higher.

## Status

The project was built in 2021/22 and is being modernised step by step. **It does
not run end to end at the moment**: the old client build and the old server are
both broken until the phases below replace them.

| Phase | Content                                                      | State   |
| ----- | ------------------------------------------------------------ | ------- |
| 0     | pnpm workspaces, `client/` `server/` `shared/`               | done    |
| 1     | Vite instead of Create React App                             | next    |
| 2     | Vitest, ESLint 9, Prettier 3, CI                             | planned |
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

  If that fails for lack of permissions, prefix the commands below with
  `corepack`, for example `corepack pnpm install`.

- [Docker Desktop](https://www.docker.com/products/docker-desktop/), needed from
  phase 3 on for the database

## Getting started

```sh
pnpm install
cp client/.env.example client/.env
cp server/.env.example server/.env
```

## Commands

Run these from the repository root.

| Command            | What it does                                    |
| ------------------ | ----------------------------------------------- |
| `pnpm client`      | Start the frontend dev server                   |
| `pnpm client:mock` | Start the frontend against mocked API responses |
| `pnpm server`      | Start the API in watch mode                     |
| `pnpm typecheck`   | Type-check all packages                         |
| `pnpm build`       | Build all packages                              |
| `pnpm format`      | Format all files with Prettier                  |

To run a script of a single package, use a filter:

```sh
pnpm --filter @beesaber/client typecheck
```

### Known failures

Until phase 1 and phase 3 are done, expect these:

- `pnpm client`, `pnpm client:mock` and `pnpm build` fail in the client because
  of imports that Redux Toolkit 2 no longer allows.
- `pnpm server` needs a MongoDB and calls a ScoreSaber API host that no longer
  exists.
- `pnpm typecheck` reports errors left over from an unfinished React 19 upgrade.

## Dependency install scripts

pnpm does not run install scripts of dependencies unless they are allowed.
Every decision is recorded under `allowBuilds` in `pnpm-workspace.yaml`. When a
new dependency asks to run a script, `pnpm install` fails and names it; allow or
deny it with:

```sh
pnpm approve-builds
```
