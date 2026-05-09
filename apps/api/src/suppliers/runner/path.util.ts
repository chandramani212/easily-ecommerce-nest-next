/**
 * Tiny JSONPath subset used by Supplier Imports.
 *
 * Supported syntax:
 *  - `$`                    root
 *  - `$.a.b.c`              nested object access
 *  - `a.b.c`                same; leading `$` and `$.` are optional
 *  - `a[0]`                 array index
 *  - `a[*]`                 wildcard array (returns array of values)
 *  - `a[*].b`               wildcard then nested
 *  - `'a.b'.c` / `"a.b".c`  quoted segments containing dots
 *
 * Why a custom parser instead of `jsonpath-plus`?
 * The mapping/dry-run UI only needs simple flat access patterns and the wildcard
 * for arrays of products/images. Pulling in a 100kB dep and its eval-based engine
 * isn't worth it; this is ~100 LOC, predictable, and side-effect-free.
 */

type Segment =
  | { kind: 'key'; name: string }
  | { kind: 'index'; index: number }
  | { kind: 'wildcard' };

function tokenize(path: string): Segment[] {
  let i = 0;
  const out: Segment[] = [];
  // Strip leading `$` or `$.`.
  if (path.startsWith('$')) i = 1;
  if (path[i] === '.') i += 1;
  if (path.startsWith('//')) i = 2; // Tolerate `//foo/bar` style XML paths.

  while (i < path.length) {
    const ch = path[i]!;
    if (ch === '.' || ch === '/') {
      i += 1;
      continue;
    }
    if (ch === '[') {
      const close = path.indexOf(']', i);
      if (close === -1) throw new Error(`Unclosed [ at ${i}`);
      const inner = path.slice(i + 1, close).trim();
      if (inner === '*') out.push({ kind: 'wildcard' });
      else if (/^\d+$/.test(inner))
        out.push({ kind: 'index', index: parseInt(inner, 10) });
      else if (/^['"].*['"]$/.test(inner))
        out.push({ kind: 'key', name: inner.slice(1, -1) });
      else out.push({ kind: 'key', name: inner });
      i = close + 1;
      continue;
    }
    if (ch === "'" || ch === '"') {
      const close = path.indexOf(ch, i + 1);
      if (close === -1) throw new Error(`Unclosed quote at ${i}`);
      out.push({ kind: 'key', name: path.slice(i + 1, close) });
      i = close + 1;
      continue;
    }
    let end = i;
    while (
      end < path.length &&
      path[end] !== '.' &&
      path[end] !== '[' &&
      path[end] !== '/'
    ) {
      end += 1;
    }
    out.push({ kind: 'key', name: path.slice(i, end) });
    i = end;
  }
  return out;
}

function step(value: unknown, seg: Segment): unknown {
  if (value === null || value === undefined) return undefined;
  if (seg.kind === 'wildcard') {
    return Array.isArray(value) ? value : [value];
  }
  if (seg.kind === 'index') {
    return Array.isArray(value) ? value[seg.index] : undefined;
  }
  if (typeof value === 'object') {
    return (value as Record<string, unknown>)[seg.name];
  }
  return undefined;
}

/**
 * Resolve a path against a value. If the path contains `[*]`, returns an
 * array of resolved leaves; otherwise returns the single resolved value.
 */
export function getPath(value: unknown, path: string): unknown {
  if (!path || path === '$') return value;
  const segs = tokenize(path);

  let frontier: unknown[] = [value];
  let isCollection = false;

  for (const seg of segs) {
    const next: unknown[] = [];
    for (const v of frontier) {
      const r = step(v, seg);
      if (seg.kind === 'wildcard') {
        isCollection = true;
        if (Array.isArray(r)) next.push(...r);
      } else if (Array.isArray(r) && isCollection) {
        // After a wildcard, intermediate arrays flatten one level.
        next.push(...r);
      } else {
        next.push(r);
      }
    }
    frontier = next;
  }

  if (isCollection) return frontier.filter((v) => v !== undefined);
  return frontier[0];
}

/**
 * Walk a value and produce a flat list of dot-paths to leaves. Used by the UI
 * mapper to suggest source paths from a sample record.
 */
export function listPaths(value: unknown, prefix = '', depth = 0): string[] {
  if (depth > 6 || value === null || value === undefined) return prefix ? [prefix] : [];
  if (Array.isArray(value)) {
    if (value.length === 0) return [`${prefix}[*]`];
    const childPaths = listPaths(value[0], `${prefix}[*]`, depth + 1);
    return childPaths;
  }
  if (typeof value === 'object') {
    const out: string[] = [];
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const next = prefix ? `${prefix}.${k}` : k;
      out.push(...listPaths(v, next, depth + 1));
    }
    return out;
  }
  return prefix ? [prefix] : [];
}
