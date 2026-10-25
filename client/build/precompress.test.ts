import { existsSync,mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';

import { precompress } from './precompress.ts';

let dir: string;

afterEach(() => rmSync(dir, { recursive: true }));

const build = (files: Record<string, string>) => {
  dir = mkdtempSync(join(tmpdir(), 'beesaber-build-'));
  mkdirSync(join(dir, 'assets'));

  for (const [name, content] of Object.entries(files))
    writeFileSync(join(dir, name), content);
};

const script = 'console.log("bee");\n'.repeat(200);

describe('precompress', () => {
  it('writes a Brotli and a gzip copy of a script, with the same content', () => {
    build({ 'assets/index.js': script });

    precompress(dir);

    const path = join(dir, 'assets/index.js');

    expect(brotliDecompressSync(readFileSync(`${path}.br`)).toString()).toBe(
      script
    );
    expect(gunzipSync(readFileSync(`${path}.gz`)).toString()).toBe(script);
    expect(readFileSync(`${path}.br`).length).toBeLessThan(script.length / 3);
  });

  it('leaves pictures and tiny files alone', () => {
    build({ 'logo.png': script, 'robots.txt': 'User-agent: *\n' });

    precompress(dir);

    expect(existsSync(join(dir, 'logo.png.br'))).toBe(false);
    expect(existsSync(join(dir, 'robots.txt.br'))).toBe(false);
  });
});
