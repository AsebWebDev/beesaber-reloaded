import { describe, expect, it } from 'vitest';

import { operationsOf } from './operationsOf.ts';

import type { Spec } from './operationsOf.ts';

const specWith = (operation: Record<string, unknown>): Spec => ({
  paths: { '/api/v2/health': { get: operation } },
});

const definitionOf = (operation: Record<string, unknown>) =>
  operationsOf(specWith(operation)).get('GET /api/v2/health');

describe('operationsOf', () => {
  it('treats a new operation id as no change', () => {
    expect(
      definitionOf({ operationId: 'u8_getHealth_v2', summary: 'Health' })
    ).toBe(definitionOf({ operationId: 'x3_getHealth_v2', summary: 'Health' }));
  });

  it('shows a real change of an operation', () => {
    expect(
      definitionOf({ operationId: 'u8_getHealth_v2', summary: 'Health' })
    ).not.toBe(
      definitionOf({ operationId: 'u8_getHealth_v2', summary: 'Status' })
    );
  });

  it('keeps a schema field that is called operationId', () => {
    const withField = (type: string) => ({
      responses: {
        200: { schema: { properties: { operationId: { type } } } },
      },
    });

    expect(definitionOf(withField('string'))).not.toBe(
      definitionOf(withField('number'))
    );
  });

  it('lists only HTTP methods', () => {
    const spec: Spec = {
      paths: { '/a': { get: { summary: 'A' }, parameters: [] } },
    };

    expect([...operationsOf(spec).keys()]).toEqual(['GET /a']);
  });
});
