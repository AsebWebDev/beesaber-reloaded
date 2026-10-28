import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Makes the generated files again and fails if that changed any of them.
 *
 * Two kinds of files are made by a tool from something else: the database
 * migrations from the schema (drizzle-kit), and the ScoreSaber types from
 * its API description (openapi-typescript). If making them again changes
 * one, someone changed the source and forgot to run the tool, and what is
 * committed does not match the code.
 *
 * Run with `pnpm --filter @beesaber/server check:generated`; CI and
 * `pnpm ci-check` both use it.
 */

const SERVER = fileURLToPath(new URL('..', import.meta.url));

/** The files the tools write, relative to the server folder */
const GENERATED = ['drizzle', 'src/scoresaber/openapi.d.ts'];

const run = (command: string) =>
  execSync(command, { cwd: SERVER, encoding: 'utf8', stdio: 'pipe' });

run('pnpm db:generate');
run('pnpm gen:api');

// Only the generated files count: on a developer's machine other files may
// well be changed and not yet committed
const changed = run(`git status --porcelain -- ${GENERATED.join(' ')}`);

if (changed.trim() === '') {
  console.log('Generated files are up to date');
} else {
  // GitHub shows a line starting with ::error:: as an error on the run
  const prefix = process.env.GITHUB_ACTIONS === 'true' ? '::error::' : '';

  console.error(
    `${prefix}Generated files are out of date. Commit the files below, which ` +
      "'pnpm --filter @beesaber/server db:generate' and 'gen:api' have just " +
      'brought up to date:'
  );
  console.error(changed);
  console.error(run(`git diff -- ${GENERATED.join(' ')}`));
  process.exit(1);
}
