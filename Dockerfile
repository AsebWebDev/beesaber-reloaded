# The whole app as one image: the API and the built frontend, served by one
# Node process. Built in stages, so the image that runs holds only what
# running needs, not the tools that built it.

# The base image is pinned to the exact content it had when it was tested.
# Dependabot proposes a newer one when there is one.

# ---------------------------------------------------------------------------
# Base for the stages that install packages: Node with pnpm, in the version
# that package.json asks for
# ---------------------------------------------------------------------------
FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS pnpm

RUN corepack enable pnpm
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

WORKDIR /repo

# The package lists only. Docker keeps the result of every step and reuses it
# while its inputs are unchanged, so a change to the code alone does not
# install all packages again.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json client/
COPY server/package.json server/

# ---------------------------------------------------------------------------
# Stage: build the frontend, with every package the build needs
# ---------------------------------------------------------------------------
FROM pnpm AS frontend

# `--ignore-scripts`: the root package installs a git hook, and there is no
# git in here
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm --filter @beesaber/client build

# ---------------------------------------------------------------------------
# Stage: the packages the server needs to run, and nothing else. The same
# versions as everywhere else, from the lockfile.
# ---------------------------------------------------------------------------
FROM pnpm AS server-packages

RUN pnpm install --frozen-lockfile --ignore-scripts --prod \
  --filter @beesaber/server

# better-auth names build tools such as drizzle-kit as optional peers, and
# pnpm links them because the workspace has them. The server never runs
# them. What they bring along includes esbuild, whose Go programs carry the
# known vulnerabilities of Go into the image. Without them, they cannot.
RUN rm -rf node_modules/.pnpm/esbuild@* node_modules/.pnpm/@esbuild+*

# ---------------------------------------------------------------------------
# Stage: what runs
# ---------------------------------------------------------------------------
FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f

# Security fixes of Alpine that came out after the base image was built.
# npm and corepack come with the base image but play no part in running
# the app, and what is not there cannot have a vulnerability.
RUN apk upgrade --no-cache \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

ENV NODE_ENV=production
ENV FRONTEND_DIR=/app/public

# pnpm keeps the packages under node_modules at the top and links them into
# server/node_modules, so both keep their places
COPY --from=server-packages /repo/node_modules /app/node_modules
COPY --from=server-packages /repo/server/node_modules /app/server/node_modules
COPY server/package.json /app/server/
COPY server/drizzle /app/server/drizzle
COPY server/src /app/server/src
COPY --from=frontend /repo/client/dist /app/public

WORKDIR /app/server

# Not as root: whoever breaks into the app gets an account that can do little
USER node

EXPOSE 5001

# Lets Docker see whether the app answers, not only whether it runs
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT ?? 5001) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"

CMD ["node", "src/index.ts"]
