/**
 * Picks the single most relevant BP leaf category for a product.
 *
 * Signal priority (highest first), as specified for this catalogue:
 *   1. Source category  — the ASI category the product was imported under,
 *      resolved to a BP leaf through `asiMap`. Trusted first because it is
 *      supplier-curated data rather than a guess.
 *   2. Product name     — matched against the LEXICON below.
 *   3. Descriptions     — shortDescription, then the long description.
 *   4. Fallback ladder  — no leaf matched inside the branch the source category
 *      points at? Land on that branch's "Other" leaf. No branch matched at all?
 *      Land on `More > Other`.
 *
 * The text signal never yanks a product out of the top-level section its source
 * category established; it only REFINES within it (e.g. source says
 * "Office & Desk > Awards > Other", the name says "Beech Star Award", so the
 * product lands on "Wood Awards"). The one exception is a product whose source
 * category resolves to a vague "Other" bucket, where text is all we have to go
 * on, and a product with no source category at all.
 */
import { bpTree, asiMap } from './bp-category-map.data';
import type { CuratedNode } from './category-map.types';

/** Where a product's words were found. Names are far more reliable than the
 *  marketing prose in a description, so they weigh more. */
const FIELD_WEIGHT = { name: 12, shortDescription: 5, description: 3 } as const;

/** Multipliers applied when the text match agrees with the source category. */
const AGREE_EXACT = 5; // text picked the very leaf the source category did
const AGREE_BRANCH = 4; // text picked a leaf inside the source category's branch
const AGREE_SECTION = 2; // text picked a leaf under the same top-level section

/**
 * Terms pointing at a catch-all "Other" leaf are heavily discounted. Such a
 * term ("award", "tote") only restates the branch we already know, so it must
 * never outrank real evidence: "Ember Award" is named award, but its
 * description says "acrylic award", and the acrylic is what decides the shelf.
 * The discount leaves these terms able to win only when nothing else matched.
 */
const VAGUE_PENALTY = 0.25;

/** A text match this weak is treated as noise. One single-word hit in a long
 *  description scores 1, which must not be allowed to move a product. */
const MIN_SCORE = 5;

/** The global catch-all, per the fallback ladder. */
export const GLOBAL_FALLBACK = 'more-other';

export interface ProductText {
  name: string;
  shortDescription?: string | null;
  description?: string | null;
}

export interface Classification {
  /** Slug of the winning BP leaf. */
  slug: string;
  /** How it was decided — surfaced in the dry-run report. */
  reason:
    | 'source' // source category resolved to a specific leaf
    | 'source+text' // text refined the source category's branch
    | 'text' // source was vague (or absent); text decided
    | 'source-other' // source branch known, nothing more specific matched
    | 'fallback'; // nothing matched at all
  score: number;
  /** The term that won, for spot-checking the lexicon. */
  matchedTerm?: string;
}

// ---------------------------------------------------------------------------
// Tree index
// ---------------------------------------------------------------------------

interface NodeInfo {
  slug: string;
  name: string;
  depth: number;
  leaf: boolean;
  parent: string | null;
  children: string[];
}

const INDEX = new Map<string, NodeInfo>();

(function indexTree(nodes: CuratedNode[], parent: string | null, depth: number) {
  for (const n of nodes) {
    const kids = n.children ?? [];
    INDEX.set(n.slug, {
      slug: n.slug,
      name: n.name,
      depth,
      leaf: kids.length === 0,
      parent,
      children: kids.map((k) => k.slug),
    });
    indexTree(kids, n.slug, depth + 1);
  }
})(bpTree, null, 1);

/** slug → [slug, parent, grandparent, …, root] */
function ancestry(slug: string): string[] {
  const out: string[] = [];
  let cur: string | null = slug;
  while (cur) {
    out.push(cur);
    cur = INDEX.get(cur)?.parent ?? null;
  }
  return out;
}

const sectionOf = (slug: string): string => ancestry(slug).slice(-1)[0];

/** A leaf literally named "Other" is a catch-all, not a real classification. */
export const isVague = (slug: string): boolean => INDEX.get(slug)?.name === 'Other';

/** Walk a branch down its "Other" children until a leaf is reached. */
export function catchAllLeaf(slug: string): string | null {
  let cur = INDEX.get(slug);
  while (cur && !cur.leaf) {
    const other = cur.children.find((c) => INDEX.get(c)?.name === 'Other');
    if (!other) return null;
    cur = INDEX.get(other);
  }
  return cur ? cur.slug : null;
}

/** Resolve an ASI source-category path to a BP leaf, exactly as the apply
 *  script does: full path first ("Awards > Crystal"), then the bare root so a
 *  child inherits its parent's mapping. */
export function resolveSourcePath(path: string, root: string): string | null {
  return asiMap[path] ?? asiMap[root] ?? null;
}

// ---------------------------------------------------------------------------
// Lexicon
// ---------------------------------------------------------------------------

/**
 * Term → BP leaf. Terms are lowercase; matching is whole-word, so "pen" never
 * fires inside "pendant" and "tee" never fires inside "steel".
 *
 * A term with more words outranks a shorter one, so specific phrases beat
 * generic ones without needing explicit priorities: for a "stainless steel
 * travel mug", "travel mug" (2 words) beats "mug" (1 word).
 *
 * Deliberately conservative: an ambiguous single word (e.g. "metal", "kit",
 * "set") is left out entirely rather than risk dragging thousands of products
 * into the wrong branch. Products those would have caught fall through to the
 * source category or the "Other" ladder, which is the safe outcome.
 */
export const LEXICON: Record<string, string[]> = {
  // ---- Drinkware ---------------------------------------------------------
  'ceramic-mugs': ['ceramic mug', 'stoneware mug', 'coffee mug', 'china mug', 'porcelain mug'],
  'metal-mugs': ['stainless steel mug', 'metal mug', 'copper mug', 'moscow mule mug'],
  'travel-mugs': ['travel mug', 'travel tumbler', 'commuter mug', 'travel cup', 'thermal mug'],
  'enamel-mugs': ['enamel mug', 'enamelware mug'],
  'campfire-mugs': ['campfire mug', 'camp mug', 'speckled mug'],
  tumblers: ['tumbler', 'stemless tumbler', 'insulated tumbler'],
  'plastic-cups-and-paper-cups': [
    'paper cup',
    'plastic cup',
    'party cup',
    'to go cup',
    'disposable cup',
  ],
  'sports-bottles': [
    'water bottle',
    'sport bottle',
    'sports bottle',
    'tritan bottle',
    'collapsible water bottle',
    'squeeze bottle',
    'cycling bottle',
    'bike bottle',
  ],
  growlers: ['growler'],
  'vacuum-flasks-and-bottles': [
    'vacuum flask',
    'vacuum bottle',
    'vacuum insulated bottle',
    'thermal bottle',
    'thermos',
  ],
  'fruit-infusers': ['fruit infuser', 'infuser bottle', 'infusion bottle'],
  'beer-glasses': ['beer glass', 'beer mug', 'beer stein', 'pilsner glass'],
  'mason-jars': ['mason jar', 'apothecary jar'],
  'hip-flasks': ['hip flask', 'flask'],
  'pint-and-stein-glasses': ['pint glass', 'stein'],
  'bar-glassware-other': [
    'shot glass',
    'whiskey glass',
    'rocks glass',
    'champagne flute',
    'wine glass',
    'wine goblet',
    'martini glass',
    'cordial shooter',
    'shooter glass',
    'highball glass',
    'brandy glass',
    'water goblet',
    'drinking glass',
  ],
  'can-coolers-and-koozies': ['can cooler', 'koozie', 'coozie', 'can holder', 'bottle cooler'],
  'bar-accessories': [
    'bar accessory',
    'cocktail shaker',
    'wine chiller',
    'jigger',
    'muddler',
    'bar tool',
    'punch bowl',
    'ice bucket',
  ],
  'ice-cubes': ['ice cube', 'reusable ice'],
  'stadium-cups': ['stadium cup'],
  'wine-products': ['wine tote', 'wine opener', 'corkscrew', 'wine stopper', 'wine bag', 'decanter'],
  straws: ['drinking straw', 'straw set'],

  // ---- Pens & pencils ----------------------------------------------------
  // 'pen' on its own defaults to the commonest promotional pen there is: a
  // plastic ballpoint. Two-word terms ('metal pen', 'gel pen') outrank it.
  'ballpoint-pens': [
    'pen',
    'ballpoint pen',
    'ball point pen',
    'gel pen',
    'click pen',
    'retractable pen',
    'plastic pen',
    'grip pen',
  ],
  'stylus-pens': ['stylus pen', 'pen stylus', 'touchscreen pen'],
  'banner-pens': ['banner pen', 'pull out pen', 'flag pen'],
  'highlighter-and-marker-pens': ['highlighter', 'marker pen', 'permanent marker', 'dry erase marker'],
  'metal-pens-ballpoint-pens': ['metal pen', 'aluminum pen', 'brass pen', 'chrome pen'],
  'multi-function-pens': ['multi function pen', 'multifunction pen', 'pen and pencil set'],
  'led-pens': ['led pen', 'light up pen', 'flashlight pen'],
  'rollerball-pens': ['rollerball pen', 'roller ball pen'],
  'fountain-pens': ['fountain pen'],
  'pen-gift-sets': ['pen gift set', 'pen set'],
  'leather-pens': ['leather pen'],
  'pen-display-boxes': ['pen box', 'pen display box', 'presentation pen case'],
  'wooden-pens': ['wooden pen', 'bamboo pen', 'wood pen'],
  standard: ['pencil', 'wooden pencil', 'golf pencil', 'round pencil', 'hex pencil'],
  mechanical: ['mechanical pencil'],
  'carpenter-pencils': ['carpenter pencil'],
  'colouring-crayons': ['crayon', 'coloring pencil', 'colouring pencil', 'colored pencil'],
  'pencil-cases': ['pencil case', 'pencil pouch'],
  'pencils-other': ['pencil top', 'pencil sharpener set'],

  // ---- Event giveaways ---------------------------------------------------
  'hand-fans': ['hand fan', 'folding fan', 'paper fan'],
  'games-and-puzzles': [
    'puzzle',
    'jigsaw',
    'board game',
    'fidget spinner',
    'fidget toy',
    'yo-yo',
    'kaleidoscope',
    'rubik',
  ],
  capes: ['superhero cape', 'cape'],
  'light-up': ['glow stick', 'light up novelty', 'glow necklace', 'led novelty'],
  'foam-hands': ['foam hand', 'foam finger'],
  'foam-products': ['foam product', 'foam visor', 'foam toy'],
  'stress-balls': ['stress ball', 'stress reliever', 'squeeze ball', 'anti stress ball'],
  'stress-animals': [
    'stress animal',
    'stress bear',
    'stress duck',
    'stress dog',
    'stress cat',
    'stress pig',
    'stress elephant',
  ],
  lanyards: ['lanyard', 'neck strap'],
  'badge-holders-and-reels': ['badge holder', 'badge reel', 'id holder', 'name badge'],
  wristbands: ['wristband', 'silicone bracelet', 'awareness band'],
  'mints-and-candy': ['mint tin', 'candy', 'mints', 'lollipop', 'gummy', 'jelly bean', 'breath mint'],
  'chocolate-gift-box': ['chocolate', 'truffle', 'cocoa gift'],
  cookies: ['cookie'],
  popcorn: ['popcorn'],
  drinks: ['coffee blend', 'tea bag', 'hot chocolate mix', 'drink mix'],
  balloons: ['balloon'],
  flags: ['flag', 'windsock', 'pennant'],
  banners: ['banner', 'retractable banner', 'roll up banner'],
  'table-covers': ['table cover', 'table throw', 'tablecloth', 'table runner'],
  tents: ['canopy tent', 'pop up tent', 'event tent'],
  inflatables: ['inflatable'],
  'led-sign': ['led sign', 'lighted sign'],
  'display-items-other': [
    'door hanger',
    'table tent',
    'shelf talker',
    'counter display',
    'display sign',
    'streamer',
    'poster frame',
    'easel',
    'hang tag',
  ],
  'custom-teddy-bears': ['teddy bear', 'plush bear', 'plush toy', 'stuffed animal'],
  magnets: ['magnet', 'car magnet', 'fridge magnet', 'magnetic clip'],
  'badges-and-medallions': [
    'lapel pin',
    'medallion',
    'medal',
    'award ribbon',
    'enamel pin',
    'trading pin',
    'emblem',
  ],
  'luggage-tags': ['luggage tag', 'bag tag'],
  tattoos: ['temporary tattoo', 'tattoo'],

  // ---- USB & tech --------------------------------------------------------
  metal: ['metal flash drive', 'metal usb'],
  'pvc-plastic': ['pvc flash drive', 'plastic flash drive', 'custom shape flash drive'],
  wooden: ['wooden flash drive', 'bamboo flash drive', 'wood usb'],
  'usb-bracelets': ['usb bracelet', 'wristband flash drive'],
  'usb-other': ['flash drive', 'usb drive', 'thumb drive', 'memory stick'],
  'power-banks': ['power bank', 'portable charger', 'battery pack', 'powerbank'],
  'stands-and-holders': ['phone stand', 'phone holder', 'tablet stand', 'device stand'],
  'tablet-cases': ['tablet case', 'ipad case'],
  'phone-cases': ['phone case', 'phone skin'],
  'phone-and-tablet-accessories': ['phone grip', 'phone ring', 'card holder for phone'],
  'wireless-chargers': ['wireless charger', 'charging pad', 'qi charger'],
  'phone-wallets': ['phone wallet'],
  'charging-cables': ['charging cable', 'usb cable', 'charging cord'],
  stylus: ['stylus'],
  'mouse-pads': ['mouse pad', 'mousepad', 'desk mat'],
  'mice-and-keyboards': ['computer mouse', 'wireless mouse', 'keyboard'],
  'usb-hubs': ['usb hub'],
  'screen-cleaning-cloths': ['screen cleaner', 'microfiber cloth', 'cleaning cloth'],
  'webcam-covers': ['webcam cover', 'camera cover'],
  'usb-fans-and-desk-fans': ['usb fan', 'desk fan', 'handheld fan'],
  clocks: ['clock', 'alarm clock', 'desk clock'],
  watches: ['watch', 'wristwatch', 'stopwatch'],
  lighting: ['desk lamp', 'led light', 'night light', 'book light'],
  'solar-products': ['solar charger', 'solar powered', 'solar light'],
  gadgets: ['bluetooth tracker', 'drone', 'binoculars', 'telescope', 'walkie talkie', 'battery'],
  speakers: ['bluetooth speaker', 'speaker'],
  'headphones-and-earphones': ['headphone', 'earphone', 'headset'],
  earbuds: ['earbud', 'ear bud'],
  radios: ['radio'],
  adapters: ['travel adapter', 'plug adapter', 'power adapter'],
  'vr-glasses-and-headsets': ['vr headset', 'virtual reality viewer', 'vr glasses'],
  'popsockets-r': ['popsocket', 'pop socket'],
  'laptop-desk-tray': ['laptop tray', 'lap desk'],
  'tech-organizer': ['tech organizer', 'cable organizer', 'cord wrap'],
  'selfie-sticks-and-lights': ['selfie stick', 'ring light'],
  'cable-ties': ['cable tie', 'cord tie'],
  wipes: ['sanitizing wipe', 'cleaning wipe', 'screen wipe'],

  // ---- Apparel -----------------------------------------------------------
  'clothing-t-shirts': ['t-shirt', 't shirt', 'tee shirt', 'short sleeve tee', 'long sleeve tee'],
  'polo-shirts': ['polo shirt', 'polo', 'golf shirt', 'sport shirt'],
  shirts: ['dress shirt', 'button down shirt', 'woven shirt', 'oxford shirt', 'flannel shirt'],
  hoodies: ['hoodie', 'hooded sweatshirt', 'pullover hoodie', 'zip hoodie'],
  sweatshirts: ['sweatshirt', 'crewneck', 'fleece pullover'],
  ponchos: ['poncho', 'rain poncho'],
  jackets: ['jacket', 'windbreaker', 'softshell', 'vest', 'parka', 'coat'],
  aprons: ['apron'],
  'safety-wear': [
    'safety vest',
    'hi vis',
    'high visibility',
    'reflective vest',
    'lab coat',
    'life vest',
    'life preserver',
  ],
  pants: [
    'sweatpant',
    'jogger',
    'pant',
    'legging',
    'short',
    'skort',
    'trouser',
    'cargo pant',
    'skirt',
  ],
  'custom-scarves': ['scarf', 'scarves'],
  'custom-bandanas': ['bandana', 'bandanna'],
  'caps-hats-and-beanies': ['cap', 'hat', 'beanie', 'visor', 'bucket hat', 'baseball cap'],
  'sunglasses-and-accessories': ['sunglasses', 'eyeglass', 'sunglass'],
  footwear: ['flip flop', 'sandal', 'shoe', 'boot', 'sneaker'],
  slippers: ['slipper'],
  'branded-socks': ['sock'],
  'apparel-accessories-other': [
    'neck tie',
    'necktie',
    'suspender',
    'handkerchief',
    'sash',
    'belt',
    'glove',
    'earmuff',
  ],

  // ---- Office & desk -----------------------------------------------------
  calendars: ['calendar', 'wall calendar', 'desk calendar'],
  calculators: ['calculator'],
  'binders-clipboards': ['binder', 'clipboard'],
  'folders-portfolios': ['portfolio', 'folder', 'padfolio', 'document folder'],
  planners: ['planner', 'weekly planner', 'monthly planner'],
  coasters: ['coaster'],
  'pen-holders-and-desk-caddys': ['pen holder', 'pen cup', 'desk caddy', 'pencil holder'],
  paperweights: ['paperweight', 'paper weight'],
  'business-card-holders': ['business card holder', 'card case'],
  notebooks: ['notebook', 'spiral notebook', 'composition book'],
  'journals-and-diaries': ['journal', 'diary'],
  notepads: ['notepad', 'note pad', 'jotter'],
  'luxury-executive-notebooks': ['executive notebook', 'leather journal', 'refillable journal'],
  'sticky-notes': ['sticky note', 'post it', 'adhesive note'],
  'memo-clips-and-memo-boards': ['memo clip', 'memo board', 'memo holder', 'photo clip'],
  'business-cards': ['business card'],
  stickers: ['sticker', 'decal', 'label'],
  'paper-clips': ['paper clip', 'binder clip'],
  'cards-envelopes-tags': ['greeting card', 'envelope', 'gift tag', 'note card', 'certificate'],
  sharpeners: ['sharpener'],
  rulers: ['ruler', 'yardstick'],
  erasers: ['eraser'],
  'letter-openers': ['letter opener'],
  'stationery-sets': ['stationery set', 'desk set', 'writing set'],
  bookmarks: ['bookmark'],
  'crystal-awards-and-trophies': [
    'crystal award',
    'crystal trophy',
    'optical crystal',
    'crystal',
    'trophy',
  ],
  'glass-awards': [
    'acrylic',
    'glass award',
    'glass trophy',
    'jade glass',
    'acrylic award',
    'acrylic plaque',
  ],
  'metal-awards': ['metal award', 'pewter award', 'silver plate award', 'metal plaque'],
  // Award blanks are named by their timber, rarely by the word "wood".
  'wood-awards': [
    'beech',
    'rosewood',
    'walnut',
    'mahogany',
    'wood award',
    'wooden award',
    'wood plaque',
    'walnut plaque',
    'rosewood plaque',
    'beech award',
    'bamboo award',
  ],
  'awards-other': ['plaque', 'award', 'certificate holder', 'recognition award'],

  // ---- Leisure -----------------------------------------------------------
  basketball: ['basketball'],
  football: ['football'],
  baseball: ['baseball', 'softball'],
  hockey: ['hockey puck', 'hockey'],
  soccer: ['soccer ball', 'soccer'],
  'noise-makers': ['noise maker', 'cowbell', 'clapper', 'thunder stick', 'horn', 'whistle'],
  'seat-cushions': ['seat cushion', 'stadium seat', 'bleacher cushion'],
  'umbrellas-best-sellers': ['umbrella'],
  telescopic: ['telescopic umbrella', 'folding umbrella', 'compact umbrella'],
  golf: ['golf umbrella'],
  parasols: ['parasol', 'beach umbrella'],
  'custom-golf-balls': ['golf ball'],
  'tees-and-markers': ['golf tee', 'ball marker', 'divot tool'],
  'golf-gift-sets': ['golf gift set', 'golf kit'],
  'golf-products-accessories': ['golf towel', 'golf bag', 'golf glove'],
  'living-home': [
    'picture frame',
    'photo frame',
    'candle',
    'vase',
    'doorstop',
    'wall art',
    'shelf',
    'chime',
    'coaster set',
  ],
  kitchenware: [
    'cutting board',
    'kitchen',
    'spatula',
    'measuring spoon',
    'oven mitt',
    'lunch box',
    'food container',
    'chopstick',
    'utensil',
  ],
  bathroom: ['towel', 'bath', 'shower', 'washcloth', 'toothbrush'],
  garden: ['garden', 'plant pot', 'watering can', 'seed packet', 'hose'],
  'beauty-and-health': ['hand sanitizer', 'sunscreen', 'nail file', 'comb', 'hairbrush'],
  chairs: ['folding chair', 'camp chair', 'beach chair'],
  'leisure-and-fun': ['frisbee', 'flying disc', 'beach ball', 'kite', 'boomerang', 'water gun'],
  cycling: ['bike light', 'bicycle', 'bike accessory', 'helmet'],
  'camping-picnic': ['picnic blanket', 'camping', 'picnic set', 'cooler chair', 'hammock'],
  beach: ['beach towel', 'beach bag', 'sand toy'],
  'sun-shades': ['sun shade', 'sunshade', 'windshield shade'],
  'ice-scrapers': ['ice scraper', 'snow brush'],
  'air-fresheners': ['air freshener'],
  'car-accessories': ['car charger mount', 'license plate', 'antenna', 'car organizer', 'car mat'],
  'car-chargers': ['car charger'],
  'tape-measures': ['tape measure', 'measuring tape'],
  flashlights: ['flashlight', 'torch', 'lantern light'],
  'lighters-and-ashtrays': ['lighter', 'ashtray'],
  'bottle-openers': ['bottle opener', 'can opener'],
  tools: ['multi tool', 'multitool', 'screwdriver', 'tool kit', 'pocket knife', 'shovel', 'caliper'],
  'cigar-accessories': ['cigar'],

  // ---- Keychains ---------------------------------------------------------
  'bottle-opener-keychains': ['bottle opener keychain', 'bottle opener key chain'],
  'led-torch-and-tools-keychains': ['led keychain', 'flashlight keychain', 'light up keychain'],
  'plastic-keychains': ['plastic keychain', 'plastic key chain', 'acrylic keychain'],
  'novelty-keychains': ['novelty keychain', 'shaped keychain'],
  'leather-keychains': ['leather keychain', 'leather key chain', 'leather key fob'],
  'wooden-keychains': ['wooden keychain', 'wood keychain', 'bamboo keychain'],
  'metal-keychains': ['metal keychain', 'metal key chain', 'keyring', 'key ring'],
  'embroidered-keychains': ['embroidered keychain'],
  'keychains-other-other': ['keychain', 'key chain', 'key fob', 'key tag'],

  // ---- Themes ------------------------------------------------------------
  '4th-july': ['4th of july', 'independence day', 'patriotic'],
  festival: ['festival', 'mardi gras'],
  halloween: ['halloween', 'pumpkin'],
  christmas: ['christmas', 'santa', 'holiday tree'],
  'valentine-s-day': ['valentine'],
  'st-patrick-s-day': ['st patrick', 'shamrock'],
  easter: ['easter', 'plastic egg'],
  'holiday-ornaments': ['ornament', 'holiday ornament'],

  // ---- Bags & totes ------------------------------------------------------
  'cotton-bags': ['cotton', 'cotton tote', 'cotton bag', 'canvas tote bag', 'organic cotton tote'],
  'canvas-bags': ['canvas bag', 'canvas tote'],
  'jute-bags': ['jute bag', 'jute tote', 'burlap bag'],
  'non-woven-bags': ['non woven', 'non woven tote', 'non woven bag', 'polypropylene tote'],
  'paper-bags': ['paper bag', 'kraft bag', 'gift bag'],
  'foldable-tote-bags': ['foldable tote', 'folding tote', 'reusable tote', 'rpet tote'],
  'plastic-bags': ['plastic bag', 'poly bag'],
  'shopping-bags-other': ['tote bag', 'tote', 'shopping bag', 'shopper'],
  'cooler-bags': ['cooler bag', 'lunch bag', 'insulated bag', 'cooler tote', 'cooler'],
  'stadium-bags': ['stadium bag', 'clear bag', 'stadium tote'],
  'waist-bags': ['waist bag', 'fanny pack', 'belt bag', 'hip pack'],
  'shoe-bags': ['shoe bag'],
  'trolley-bags': ['trolley bag', 'rolling bag', 'wheeled bag'],
  'toiletry-bags': ['toiletry bag', 'dopp kit', 'cosmetic bag', 'makeup bag'],
  backpacks: ['backpack', 'book bag'],
  rucksacks: ['rucksack'],
  'duffel-bags': ['duffel bag', 'duffle bag', 'gym bag', 'sport bag'],
  'drawstring-bags': ['drawstring bag', 'cinch pack', 'string backpack', 'drawstring backpack'],
  'messenger-bag': ['messenger bag', 'crossbody bag', 'shoulder bag'],
  'laptop-and-tablet-bags-and-sleeves': ['laptop bag', 'laptop sleeve', 'tablet sleeve', 'computer bag'],
  'document-and-conference-bags': ['conference bag', 'document bag', 'briefcase', 'attache'],
  // NB: no bare 'luggage' — it outranked 'luggage tag' (a tag is not a bag)
  // because Travel Bags sits inside the Bags branch and so earned the
  // branch-agreement bonus, while Luggage Tags is in Event Giveaways.
  'travel-bags': ['travel bag', 'weekender', 'suitcase', 'garment bag'],
  'wallets-and-purses': ['wallet', 'purse', 'coin pouch', 'card wallet', 'money clip'],

  // ---- Eco-friendly ------------------------------------------------------
  bamboo: ['bamboo'],
  'reusable-straws': ['reusable straw', 'metal straw', 'silicone straw', 'bamboo straw'],
  'plants-and-seeds': ['seed', 'plant kit', 'seedling', 'grow kit'],

  // ---- Healthcare --------------------------------------------------------
  'infection-control-and-ppe': [
    'face mask',
    'ppe',
    'hand sanitizer bottle',
    'disposable glove',
    'face shield',
    'antimicrobial',
  ],
  'first-aid-and-emergency-preparedness': ['first aid', 'emergency kit', 'bandage', 'medical information'],
  'patient-care-and-monitoring': ['thermometer', 'blood pressure', 'pulse oximeter', 'pill splitter'],
  'medication-adherence-tools': ['pill box', 'pill case', 'medication reminder', 'pill organizer'],
  'staff-id-and-workplace-essentials': ['id badge', 'nurse', 'scrub'],

  // ---- More --------------------------------------------------------------
  soap: ['soap', 'body wash'],
  mirrors: ['mirror', 'compact mirror'],
  'lip-balms': ['lip balm', 'chapstick', 'lip moisturizer'],
  'first-aid-kits': ['first aid kit'],
  'custom-shoe-horns': ['shoe horn', 'shoehorn'],
  'shoe-covers': ['shoe cover'],
  'shoe-shine-kits': ['shoe shine'],
  yoga: ['yoga mat', 'yoga'],
  'fitness-accessories': [
    'resistance band',
    'jump rope',
    'pedometer',
    'fitness tracker',
    'water bottle sling',
    'gym towel',
  ],
  'cooling-towels': ['cooling towel'],
  'collars-and-leashes': ['pet collar', 'leash', 'dog collar'],
  'pet-bowls': ['pet bowl', 'dog bowl'],
  'pet-care-other': ['pet toy', 'dog toy', 'pet waste bag'],
  'piggy-banks': ['piggy bank', 'coin bank'],
  'coloring-books': ['coloring book', 'colouring book', 'activity book'],
  blankets: ['blanket', 'fleece throw', 'throw blanket'],
  'playing-cards': ['playing card', 'deck of cards', 'poker set'],
  lanterns: ['lantern'],
  'desk-organizers': ['desk organizer', 'organizer tray', 'photo album'],
};

// ---------------------------------------------------------------------------
// Matcher
// ---------------------------------------------------------------------------

interface Term {
  term: string;
  slug: string;
  words: number;
  re: RegExp;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Longest terms first so "travel mug" is tested before "mug". */
const TERMS: Term[] = Object.entries(LEXICON)
  .flatMap(([slug, terms]) =>
    terms.map((term) => ({
      term,
      slug,
      words: term.split(/\s+/).length,
      // \b does not fire next to "-", so normalise separators before matching
      // and anchor on spaces instead.
      re: new RegExp(`(^| )${escape(term)}(s|es)?($| )`),
    })),
  )
  .sort((a, b) => b.words - a.words || b.term.length - a.term.length);

/** Lowercase, strip punctuation to spaces, collapse runs. Keeps digits so
 *  "4th of july" still matches. */
export function normalise(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
}

/**
 * Classify one product.
 *
 * @param text        name + descriptions
 * @param candidates  BP leaf slugs derived from the product's source categories
 */
export function classifyProduct(text: ProductText, candidates: string[]): Classification {
  const fields: [keyof typeof FIELD_WEIGHT, string][] = [
    ['name', normalise(text.name ?? '')],
    ['shortDescription', normalise(text.shortDescription ?? '')],
    ['description', normalise(text.description ?? '')],
  ];

  const valid = candidates.filter((c) => INDEX.has(c));
  const candSections = new Set(valid.map(sectionOf));
  const candSet = new Set(valid);
  // Every branch a candidate sits under, so "is this leaf a refinement of a
  // candidate's branch?" is a set lookup.
  const candBranches = new Set(valid.flatMap((c) => ancestry(c)));

  // ---- text matches -----------------------------------------------------
  // Best score per leaf, so the winner is available AND each candidate's own
  // text support can be looked up when breaking ties below.
  const scoreByLeaf = new Map<string, number>();
  let bestSlug: string | null = null;
  let bestScore = 0;
  let bestTerm: string | undefined;

  for (const t of TERMS) {
    for (const [field, value] of fields) {
      if (!value.trim()) continue;
      if (!t.re.test(value)) continue;
      let score = t.words * FIELD_WEIGHT[field];
      // Agreement bonuses reward a text match that CONFIRMS the source
      // category. A catch-all "Other" leaf is not a classification, so it never
      // earns one — otherwise a bland word ("award") landing on the bucket the
      // source already chose would outscore the specific term ("beech") that
      // actually tells us where the product belongs.
      if (isVague(t.slug)) {
        score *= VAGUE_PENALTY;
      } else if (candSet.has(t.slug)) {
        score *= AGREE_EXACT;
      } else if (candBranches.has(t.slug) || ancestry(t.slug).some((a) => candBranches.has(a))) {
        score *= AGREE_BRANCH;
      } else if (candSections.has(sectionOf(t.slug))) {
        score *= AGREE_SECTION;
      }
      if (score > (scoreByLeaf.get(t.slug) ?? 0)) scoreByLeaf.set(t.slug, score);
      if (score > bestScore) {
        bestScore = score;
        bestSlug = t.slug;
        bestTerm = t.term;
      }
      break; // strongest field for this term already counted
    }
  }

  const textLeaf = bestSlug && bestScore >= MIN_SCORE ? bestSlug : null;

  // ---- best source candidate --------------------------------------------
  // A product routinely carries several source categories (2.26 on average),
  // so this is a real choice, not a formality. Text evidence decides it first:
  // "SUEDE MATERIAL Full Color Imprinted Cleaning Cloths" arrives under
  // Microfiber Cloths, Eyeglass Cleaners AND Notebooks, and only the name says
  // which one it actually is. Falling back on depth or alphabetical order
  // silently filed it under Notebooks.
  const srcLeaf =
    [...valid].sort((a, b) => {
      // A real classification always beats a catch-all, however much text
      // evidence the catch-all has — "shot glass" supporting Bar Glassware >
      // Other must not beat a specific sibling candidate.
      const va = isVague(a) ? 1 : 0;
      const vb = isVague(b) ? 1 : 0;
      if (va !== vb) return va - vb;
      const sa = scoreByLeaf.get(a) ?? 0;
      const sb = scoreByLeaf.get(b) ?? 0;
      if (sa !== sb) return sb - sa;
      const da = INDEX.get(a)!.depth;
      const db = INDEX.get(b)!.depth;
      if (da !== db) return db - da;
      return a.localeCompare(b);
    })[0] ?? null;

  // ---- resolution ladder ------------------------------------------------
  if (srcLeaf && !isVague(srcLeaf)) {
    // Source category gave a real answer. Text may only refine within the same
    // top-level section, and only if it is at least as specific.
    if (
      textLeaf &&
      textLeaf !== srcLeaf &&
      sectionOf(textLeaf) === sectionOf(srcLeaf) &&
      INDEX.get(textLeaf)!.depth >= INDEX.get(srcLeaf)!.depth
    ) {
      return { slug: textLeaf, reason: 'source+text', score: bestScore, matchedTerm: bestTerm };
    }
    return { slug: srcLeaf, reason: 'source', score: 0 };
  }

  if (srcLeaf) {
    // Source category only got us to a catch-all bucket; text decides — but it
    // still may not leave the section the source established. "Recycled
    // Non-Woven T-Shirt Tote" is a bag, and the words "t-shirt" must not drag
    // it into Apparel. The sole exception is the global fallback, which the
    // deliberately vague source categories ("Kits", "Gift Sets", "Custom
    // Products") map to: those carry no section information at all, so a text
    // match anywhere in the tree is better than nothing.
    const unrestricted = srcLeaf === GLOBAL_FALLBACK;
    if (textLeaf && (unrestricted || sectionOf(textLeaf) === sectionOf(srcLeaf))) {
      return { slug: textLeaf, reason: 'text', score: bestScore, matchedTerm: bestTerm };
    }
    return { slug: srcLeaf, reason: 'source-other', score: 0 };
  }

  // No source category at all.
  if (textLeaf) {
    return { slug: textLeaf, reason: 'text', score: bestScore, matchedTerm: bestTerm };
  }
  return { slug: GLOBAL_FALLBACK, reason: 'fallback', score: 0 };
}

/** Exposed for the apply script's validation phase. */
export function leafSlugs(): string[] {
  return [...INDEX.values()].filter((n) => n.leaf).map((n) => n.slug);
}
