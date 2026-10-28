import { describe, expect, it } from 'vitest';

import { resolveRefs } from './resolveRefs.ts';

const spec = {
  components: {
    schemas: {
      Player: {
        type: 'object',
        properties: { name: { type: 'string' } },
      },
      Node: {
        type: 'object',
        properties: { child: { $ref: '#/components/schemas/Node' } },
      },
      'a/b': { type: 'number' },
    },
  },
};

describe('resolveRefs', () => {
  it('puts what a reference points to in its place', () => {
    expect(
      resolveRefs({ schema: { $ref: '#/components/schemas/Player' } }, spec)
    ).toEqual({
      schema: { type: 'object', properties: { name: { type: 'string' } } },
    });
  });

  it('shows a change of a shared schema in everything that uses it', () => {
    const operation = { schema: { $ref: '#/components/schemas/Player' } };
    const changed = structuredClone(spec);

    changed.components.schemas.Player.properties.name.type = 'number';

    expect(JSON.stringify(resolveRefs(operation, changed))).not.toBe(
      JSON.stringify(resolveRefs(operation, spec))
    );
  });

  it('stops at a schema that contains itself', () => {
    expect(resolveRefs({ $ref: '#/components/schemas/Node' }, spec)).toEqual({
      type: 'object',
      properties: { child: { $ref: '#/components/schemas/Node' } },
    });
  });

  it('reads the escapes of JSON Pointer', () => {
    expect(resolveRefs({ $ref: '#/components/schemas/a~1b' }, spec)).toEqual({
      type: 'number',
    });
  });

  it('leaves everything else as it is', () => {
    expect(resolveRefs([1, 'two', null, { three: true }], spec)).toEqual([
      1,
      'two',
      null,
      { three: true },
    ]);
  });
});
