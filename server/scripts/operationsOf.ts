import { resolveRefs } from './resolveRefs.ts';

type Spec = { paths: Record<string, Record<string, unknown>> };

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

/**
 * ScoreSaber's operation ids start with a generated prefix that differs
 * between its builds ("u8_getHealth_v2"). The id names an operation and is
 * no part of what it accepts or returns, so a new prefix is no API change.
 *
 * Only the operation's own id goes: a field called `operationId` inside a
 * schema is part of the API.
 */
const withoutOperationId = (definition: unknown) =>
  definition !== null && typeof definition === 'object'
    ? Object.fromEntries(
        Object.entries(definition).filter(([key]) => key !== 'operationId')
      )
    : definition;

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
          JSON.stringify(resolveRefs(withoutOperationId(definition), spec)),
        ])
    )
  );

export { operationsOf };
export type { Spec };
