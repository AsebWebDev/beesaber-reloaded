import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Makes the generated files again and fails if that changed any of them.
 *
 * Two kinds of files are made by a tool from something else: the database
 * migrations from the schema (drizzle-kit), and the ScoreSaber types from
 * its API description (openapi-typescript). If making them again changes
 * one, someone changed the source and forgot to run the tool.
 *
 * What counts is whether the tools change anything, not whether the files
 * differ from the last commit: a migration made a minute ago and not yet
 * committed is up to date. In CI, where everything is committed, the two
 * are the same.
 *
 * Run with `pnpm --filter @beesaber/server check:generated`; CI and
 * `pnpm ci-check` both use it.
 */

const SERVER = fileURLToPath(new URL('..', import.meta.url));

/** The files the tools write, relative to the server folder */
const GENERATED = ['drizzle', 'src/scoresaber/openapi.d.ts'];

const run = (command: string) =>
  execSync(command, { cwd: SERVER, encoding: 'utf8', stdio: 'pipe' });

/** Every file under a path, or the path itself if it is a file */
const filesUnder = (path: string): string[] => {
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) return [path];

  return readdirSync(path).flatMap((name) => filesUnder(join(path, name)));
};

/** A fingerprint of every generated file, by its path */
const snapshot = () =>
  new Map(
    GENERATED.flatMap((path) => filesUnder(join(SERVER, path))).map((file) => [
      relative(SERVER, file).replaceAll('\\', '/'),
      createHash('sha256').update(readFileSync(file)).digest('hex'),
    ])
  );

const before = snapshot();

run('pnpm db:generate');
run('pnpm gen:api');

const after = snapshot();
const changed = [...new Set([...before.keys(), ...after.keys()])]
  .filter((file) => before.get(file) !== after.get(file))
  .sort();

if (changed.length === 0) {
  console.log('Generated files are up to date');
} else {
  // GitHub shows a line starting with ::error:: as an error on the run
  const prefix = process.env.GITHUB_ACTIONS === 'true' ? '::error::' : '';

  console.error(
    `${prefix}Generated files were out of date. The tools have just ` +
      'brought these up to date; commit them:'
  );

  for (const file of changed)
    console.error(
      `  ${file}${before.has(file) ? (after.has(file) ? '' : ' (removed)') : ' (new)'}`
    );

  process.exit(1);
}
