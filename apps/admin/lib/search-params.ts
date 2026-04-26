import { IS_DEMO } from "./demo";

export type SearchParamsRecord = Record<
  string,
  string | string[] | undefined
>;

/**
 * Resolve a page's `searchParams` while being compatible with `output: 'export'`.
 *
 * In demo/static builds we must never `await` the searchParams promise (it is
 * considered a dynamic API by Next.js and forces dynamic rendering, which is
 * incompatible with static export). So we return an empty object in that mode.
 * Filter / search UI still works client-side via `useSearchParams`.
 */
export async function resolveSearchParams(
  promise: Promise<SearchParamsRecord>,
): Promise<SearchParamsRecord> {
  if (IS_DEMO) return {};
  return promise;
}

export function pickParam(
  sp: SearchParamsRecord,
  key: string,
): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}
