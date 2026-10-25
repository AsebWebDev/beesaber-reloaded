import {
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

import type { Plugin } from 'vite';

/** Text, which shrinks to about a third. Pictures are compressed already. */
const COMPRESSIBLE = /\.(?:html|js|css|svg|json|webmanifest|txt|ico)$/;

/** Below this, the saving does not make up for the work of unpacking */
const MIN_BYTES = 1024;

const filesIn = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);

    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });

/**
 * Writes a Brotli (.br) and a gzip (.gz) copy next to every text file in
 * the folder. The server hands a browser the smallest one it understands
 * (see precompressed in server/src/http/frontend.ts), so a visitor loads a
 * third of the bytes, and nothing has to be compressed while they wait.
 */
const precompress = (dir: string) => {
  for (const path of filesIn(dir)) {
    if (!COMPRESSIBLE.test(path)) continue;

    const content = readFileSync(path);

    if (content.length < MIN_BYTES) continue;

    // The strongest settings: it happens once, at build time
    writeFileSync(
      `${path}.br`,
      brotliCompressSync(content, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
      })
    );
    writeFileSync(`${path}.gz`, gzipSync(content, { level: 9 }));
  }
};

/** Runs precompress over the build's output, after everything is written */
const precompressPlugin = (): Plugin => {
  let outDir = 'dist';

  return {
    name: 'precompress',
    apply: 'build',
    configResolved: (config) => {
      outDir = join(config.root, config.build.outDir);
    },
    closeBundle: () => precompress(outDir),
  };
};

export { precompress, precompressPlugin };
