/**
 * A part of an OpenAPI description with every `$ref` replaced by what it
 * points to, so two versions can be compared by their content alone.
 *
 * ScoreSaber's description writes every schema out in full today. Should it
 * start sharing schemas under `components`, an endpoint's own definition
 * would stay the same while a schema it points to changes. Resolved, that
 * change shows as a change of every endpoint using the schema.
 *
 * A schema that contains itself, like a tree, is resolved once and then
 * left as its reference, instead of going round forever.
 */
const resolveRefs = (
  value: unknown,
  spec: unknown,
  seen: readonly string[] = []
): unknown => {
  if (Array.isArray(value))
    return value.map((item) => resolveRefs(item, spec, seen));
  if (value === null || typeof value !== 'object') return value;

  const ref = (value as Record<string, unknown>).$ref;

  if (typeof ref === 'string' && ref.startsWith('#/')) {
    if (seen.includes(ref)) return { $ref: ref };

    // "#/components/schemas/Player" → spec.components.schemas.Player, with
    // the escapes of JSON Pointer: ~1 stands for "/", ~0 for "~"
    const target = ref
      .slice(2)
      .split('/')
      .map((key) => key.replaceAll('~1', '/').replaceAll('~0', '~'))
      .reduce<unknown>(
        (node, key) =>
          node !== null && typeof node === 'object'
            ? (node as Record<string, unknown>)[key]
            : undefined,
        spec
      );

    return resolveRefs(target, spec, [...seen, ref]);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      resolveRefs(child, spec, seen),
    ])
  );
};

export { resolveRefs };
