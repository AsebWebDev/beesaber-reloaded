// Checks the GitHub Actions workflows with actionlint: expressions that
// point at steps or inputs that do not exist, wrong types, and the shell
// scripts in their steps (through shellcheck). A broken workflow fails here,
// before it is merged, instead of on its first run.
//
// Runs actionlint's image, pinned by digest, so it needs Docker and nothing
// else. CI and `pnpm ci-check` run the same command.
import { spawnSync } from 'node:child_process';

const IMAGE =
  'rhysd/actionlint:1.7.12@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667';

const { status, error } = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '-v',
    `${process.cwd()}:/repo`,
    '-w',
    '/repo',
    IMAGE,
    '-color',
  ],
  { stdio: 'inherit' }
);

if (error) {
  // Without Docker, spawning it fails before actionlint could say anything
  console.error(
    `actionlint runs in Docker, which could not be started: ${error.message}`
  );
  process.exit(1);
}

process.exit(status ?? 1);
