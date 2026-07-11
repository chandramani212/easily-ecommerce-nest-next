/**
 * Generates category-map.data.ts from asi-category-tree.json.
 *
 * Curated 3-level tree:
 *   L1 = competitor-named nav groups (GROUPS below)
 *   L2 = ASI top-level categories (the 50 in the ASI tree)
 *   L3 = ASI subcategories (leaves)
 * A top with subcategories → L2 is a parent, its children are L3 leaves.
 * A top with no subcategories → L2 is itself a leaf.
 *
 * sourceMap keys are ASI ContextPaths (the search token). Re-run after
 * editing GROUPS / TOP_TO_GROUP:  node src/sources/category-map/generate-map.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const tree = JSON.parse(readFileSync(join(here, 'asi-category-tree.json'), 'utf8'));

// L1 nav groups — names taken from the competitor sites (everythingpromo /
// brandedpromo). Order controls storefront nav order.
const GROUPS = [
  { slug: 'bestsellers', name: 'Best Sellers' }, // empty leaf, filled manually
  { slug: 'pens', name: 'Pens' },
  { slug: 'drinkware', name: 'Drinkware' },
  { slug: 'bags-totes', name: 'Bags & Totes' },
  { slug: 'apparel', name: 'Apparel' },
  { slug: 'office-desk', name: 'Office & Desk' },
  { slug: 'usb-tech', name: 'USB & Tech' },
  { slug: 'keychains', name: 'Keychains' },
  { slug: 'leisure', name: 'Leisure' },
  { slug: 'events-giveaways', name: 'Events & Giveaways' },
];

// ASI top-level ContextPath -> { group slug, pretty L2 name }.
// L2 names lean on competitor wording where it matches.
const TOP_TO_GROUP = {
  PENS: { group: 'pens', l2: 'Pens' },

  'GLASSES-DRINKING': { group: 'drinkware', l2: 'Glassware' },
  BOTTLES: { group: 'drinkware', l2: 'Water Bottles' },
  'TRAVEL MUGS/CUPS': { group: 'drinkware', l2: 'Travel Mugs & Cups' },
  'MUGS & STEINS': { group: 'drinkware', l2: 'Mugs' },
  'BEVERAGE HOLDERS': { group: 'drinkware', l2: 'Can Coolers & Koozies' },
  'BAR ACCESSORIES': { group: 'drinkware', l2: 'Bar Accessories' },
  'WINE ACCESSORIES': { group: 'drinkware', l2: 'Wine Accessories' },
  OPENERS: { group: 'drinkware', l2: 'Bottle Openers' },
  'COASTERS & COASTER SETS': { group: 'drinkware', l2: 'Coasters' },

  BAGS: { group: 'bags-totes', l2: 'Bags' },
  'TOTE BAGS': { group: 'bags-totes', l2: 'Tote Bags' },
  BACKPACKS: { group: 'bags-totes', l2: 'Backpacks' },
  POUCHES: { group: 'bags-totes', l2: 'Pouches' },
  COOLERS: { group: 'bags-totes', l2: 'Cooler Bags' },

  'PERFORMANCE APPAREL': { group: 'apparel', l2: 'Performance Apparel' },
  JACKETS: { group: 'apparel', l2: 'Jackets' },
  'T-SHIRTS': { group: 'apparel', l2: 'T-Shirts' },
  'GOLF/POLO SHIRTS': { group: 'apparel', l2: 'Polo Shirts' },
  SHIRTS: { group: 'apparel', l2: 'Shirts' },
  'SWEAT SHIRTS': { group: 'apparel', l2: 'Sweatshirts' },
  UNIFORMS: { group: 'apparel', l2: 'Uniforms' },
  'CAPS & HATS': { group: 'apparel', l2: 'Caps, Hats & Beanies' },
  'BASEBALL CAPS': { group: 'apparel', l2: 'Baseball Caps' },
  SUNGLASSES: { group: 'apparel', l2: 'Sunglasses' },

  NOTEBOOKS: { group: 'office-desk', l2: 'Notebooks' },
  'JOURNALS & DIARIES': { group: 'office-desk', l2: 'Journals & Diaries' },
  CALENDARS: { group: 'office-desk', l2: 'Calendars' },
  AWARDS: { group: 'office-desk', l2: 'Awards' },

  'MOBILE ACCESSORIES': { group: 'usb-tech', l2: 'Phone & Tablet' },
  'BATTERY RECHARGERS & ADAPTORS': { group: 'usb-tech', l2: 'Chargers & Power Banks' },
  'USB/FLASH DRIVES': { group: 'usb-tech', l2: 'USB Drives' },
  FANS: { group: 'usb-tech', l2: 'Fans' },

  'KEY CHAINS': { group: 'keychains', l2: 'Keychains' },

  'SPORTS EQUIPMENT & ACCESS.': { group: 'leisure', l2: 'Sports' },
  'GOLF ACCESSORIES': { group: 'leisure', l2: 'Golf' },
  'TOOLS-KITCHEN': { group: 'leisure', l2: 'Kitchen Tools' },
  TOWELS: { group: 'leisure', l2: 'Towels' },

  'STRESS RELIEVERS': { group: 'events-giveaways', l2: 'Stress Toys' },
  LANYARDS: { group: 'events-giveaways', l2: 'Lanyards' },
  'BADGE HOLDERS': { group: 'events-giveaways', l2: 'Badge Holders' },
  CANDY: { group: 'events-giveaways', l2: 'Candy' },
  'FOOD GIFTS': { group: 'events-giveaways', l2: 'Food Gifts' },
  FLAGS: { group: 'events-giveaways', l2: 'Flags' },
  BANNERS: { group: 'events-giveaways', l2: 'Banners' },
  'SIGNS & DISPLAYS': { group: 'events-giveaways', l2: 'Signs & Displays' },
  DECALS: { group: 'events-giveaways', l2: 'Decals & Stickers' },
  MAGNETS: { group: 'events-giveaways', l2: 'Magnets' },
  'GIFT SETS': { group: 'events-giveaways', l2: 'Gift Sets' },
  KITS: { group: 'events-giveaways', l2: 'Kits' },
};

const ALWAYS_CREATE = ['bestsellers'];

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Prettify an L3 label by stripping the parent's segment prefix from the
// child ContextPath. "Glasses-Drinking-Sets" (parent GLASSES-DRINKING) -> "Sets".
function leafLabel(childCtx, parentCtx) {
  const parentSegs = parentCtx.split('-').length;
  const rest = childCtx.split('-').slice(parentSegs).join('-').trim();
  return rest || childCtx;
}

const tops = tree.filter((n) => n.level === 1);
const childrenByParent = {};
for (const n of tree) if (n.level === 2) (childrenByParent[n.parent] ??= []).push(n);

const groupNodes = new Map(GROUPS.map((g) => [g.slug, { ...g, children: [] }]));
const sourceMap = {};
const skipped = [];

for (const top of tops) {
  const cfg = TOP_TO_GROUP[top.ctx];
  if (!cfg) { skipped.push(top.ctx); continue; }
  const group = groupNodes.get(cfg.group);
  const l2slug = slugify('cat-' + top.ctx);
  const kids = (childrenByParent[top.ctx] ?? []).sort((a, b) => b.products - a.products);

  if (kids.length === 0) {
    // L2 is itself a leaf.
    group.children.push({ slug: l2slug, name: cfg.l2 });
    sourceMap[top.ctx] = l2slug; // ContextPath -> leaf
  } else {
    const l2 = { slug: l2slug, name: cfg.l2, children: [] };
    for (const k of kids) {
      const l3slug = slugify('sub-' + k.ctx);
      l2.children.push({ slug: l3slug, name: leafLabel(k.ctx, top.ctx) });
      sourceMap[k.ctx] = l3slug; // ContextPath -> leaf
    }
    group.children.push(l2);
  }
}

// Assemble curatedTree in GROUPS order; drop empty groups (except alwaysCreate).
const curatedTree = [];
for (const g of GROUPS) {
  const node = groupNodes.get(g.slug);
  if (node.children.length === 0 && !ALWAYS_CREATE.includes(g.slug)) continue;
  if (node.children.length === 0) delete node.children; // e.g. bestsellers leaf
  curatedTree.push(node);
}

const header = `// AUTO-GENERATED by generate-map.mjs from asi-category-tree.json.
// Edit GROUPS / TOP_TO_GROUP in the generator and re-run; do not hand-edit.
import type { CuratedNode, SourceMap } from './category-map.types';

/** Curated slugs to create even with no mapping (empty leaves). */
export const ALWAYS_CREATE: string[] = ${JSON.stringify(ALWAYS_CREATE)};

export const curatedTree: CuratedNode[] = ${JSON.stringify(curatedTree, null, 2)};

/** ASI ContextPath -> curated leaf slug. */
export const sourceMap: SourceMap = ${JSON.stringify(sourceMap, null, 2)};
`;

writeFileSync(join(here, 'category-map.data.ts'), header);

// Report.
const leafCount = Object.keys(sourceMap).length;
process.stderr.write(
  `groups: ${curatedTree.length}\n` +
  `mapped ContextPaths (leaves): ${leafCount}\n` +
  `skipped tops (no group): ${skipped.length ? skipped.join(', ') : 'none'}\n`,
);
