import { describe, it, expect } from '@jest/globals';

import { CuratedNode, SourceMap } from './category-map.types';
import {
  flattenTree,
  leafSlugs,
  validateSourceMap,
  usedSlugsToCreate,
  matchProductIds,
} from './category-map.util';

const tree: CuratedNode[] = [
  { slug: 'bestsellers', name: 'Best Sellers' },
  {
    slug: 'apparel',
    name: 'Apparel',
    children: [
      { slug: 't-shirts', name: 'T-Shirts', children: [{ slug: 't-shirts-mens', name: "Men's" }] },
      { slug: 'polos', name: 'Polos' },
    ],
  },
];

describe('category-map util', () => {
  it('flattens parents before children with parent + leaf info', () => {
    const flat = flattenTree(tree).map((n) => n.slug);
    expect(flat.indexOf('apparel')).toBeLessThan(flat.indexOf('t-shirts'));
    expect(flat.indexOf('t-shirts')).toBeLessThan(flat.indexOf('t-shirts-mens'));
    const mens = flattenTree(tree).find((n) => n.slug === 't-shirts-mens')!;
    expect(mens.parentSlug).toBe('t-shirts');
    expect(mens.isLeaf).toBe(true);
  });

  it('identifies leaves', () => {
    expect(leafSlugs(tree)).toEqual(new Set(['bestsellers', 't-shirts-mens', 'polos']));
  });

  it('rejects mapping to a non-leaf or missing slug', () => {
    const bad: SourceMap = { A: 'apparel', B: 'nope', C: 'polos' };
    const errs = validateSourceMap(tree, bad);
    expect(errs.some((e) => e.includes('apparel'))).toBe(true); // parent, not leaf
    expect(errs.some((e) => e.includes('nope'))).toBe(true); // missing
    expect(errs.some((e) => e.includes('polos'))).toBe(false); // valid leaf
  });

  it('accepts a valid all-leaf mapping', () => {
    expect(validateSourceMap(tree, { A: 't-shirts-mens', B: 'polos' })).toEqual([]);
  });

  it('creates used leaves + ancestors + alwaysCreate only', () => {
    const map: SourceMap = { A: 't-shirts-mens' };
    const used = usedSlugsToCreate(tree, map, ['bestsellers']);
    expect(used).toEqual(new Set(['t-shirts-mens', 't-shirts', 'apparel', 'bestsellers']));
    expect(used.has('polos')).toBe(false); // unused → pruned
  });

  it('matches asi ids to product ids, deduped, order preserved', () => {
    const link = new Map([
      ['a1', 'pA'],
      ['a2', 'pB'],
    ]);
    expect(matchProductIds(['a1', 'a2', 'a1', 'a9'], link)).toEqual(['pA', 'pB']);
  });
});
