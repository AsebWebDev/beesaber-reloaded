import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { resolveRefs } from './resolveRefs.ts';

/**
 * Downloads ScoreSaber's current OpenAPI description, replaces our copy and
 * reports what changed. Run it with `pnpm api:update`, which regenerates the
 * types afterwards.
 *
 * The copy is stored with indentation, so `git diff` shows every change in
 * detail.
 */

const SOURCE = 'https://scoresaber.com/api/openapi.json';
const TARGET = fileURLToPath(
  new URL('../src/scoresaber/openapi.json', import.meta.url)
);

/** The endpoints the server calls. A change to one of these needs a look. */
const USED = [
  'GET /api/v2/players',
  'GET /api/v2/players/{id}',
  'GET /api/v2/players/{id}/scores',
];

type Spec = { paths: Record<string, Record<string, unknown>> };

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

/**
 * Every operation of a description, as "GET /path" with its definition.
 * References are resolved first, so a change to a schema an operation
 * points to counts as a change of the operation.
 */
const operationsOf = (spec: Spec) =>
  new Map(
    Object.entries(spec.paths).flatMap(([path, methods]) =>
      Object.entries(methods)
        .filter(([method]) => METHODS.includes(method))
        .map(([method, definition]): [string, string] => [
          `${method.toUpperCase()} ${path}`,
          JSON.stringify(resolveRefs(definition, spec)),
        ])
    )
  );

const isSpec = (value: unknown): value is Spec =>
  typeof value === 'object' &&
  value !== null &&
  'openapi' in value &&
  'paths' in value &&
  typeof value.paths === 'object';

const response = await fetch(SOURCE);

if (!response.ok)
  throw new Error(`Download failed: HTTP ${response.status} from ${SOURCE}`);

const latest: unknown = await response.json();

// Guard against saving an error page or an empty answer over the good copy
if (!isSpec(latest) || Object.keys(latest.paths).length === 0)
  throw new Error(`${SOURCE} did not return an OpenAPI description`);

const current: unknown = JSON.parse(await readFile(TARGET, 'utf8'));

if (!isSpec(current))
  throw new Error(`${TARGET} is not an OpenAPI description`);

const before = operationsOf(current);
const after = operationsOf(latest);

const added = [...after.keys()].filter((key) => !before.has(key));
const removed = [...before.keys()].filter((key) => !after.has(key));
const changed = [...after.keys()].filter(
  (key) => before.has(key) && before.get(key) !== after.get(key)
);
const affected = USED.filter(
  (key) => removed.includes(key) || changed.includes(key)
);

await writeFile(TARGET, `${JSON.stringify(latest, null, 2)}\n`);

const list = (title: string, keys: string[]) => {
  if (keys.length === 0) return;

  console.log(`\n${title} (${keys.length})`);
  for (const key of keys) console.log(`  ${key}`);
};

if (added.length + removed.length + changed.length === 0) {
  console.log('No changes. The copy is up to date.');
} else {
  list('Added', added);
  list('Removed', removed);
  list('Changed', changed);

  if (affected.length > 0) {
    list('CHECK THESE, the server uses them', affected);
    console.log('\nSee src/scoresaber/client.ts and run the tests.');
  } else {
    console.log('\nNone of the endpoints the server uses changed.');
  }
}
