/**
 * Generates category-map.data.ts from db-source-tree.json (a snapshot of the
 * live ASI SourceCategory rows: { ext, name, parent, parentName, level,
 * products }).
 *
 * Curated 3-level storefront taxonomy (modeled on printed4you.co.uk /
 * everythingpromo.com / brandedpromo.com):
 *   L1 = nav GROUPS (below)
 *   L2 = curated category (a source top-with-children, or a bucket that gathers
 *        several childless source tops)
 *   L3 = leaf (the source subcategories, or a childless source top). Products
 *        render on leaves only.
 *
 * Authoring model — TOP_MAP[<exact DB top name>] = { group, l2 }:
 *   - Top WITH children  -> its own L2 named `l2`; each child becomes an L3 leaf.
 *   - Top WITHOUT children -> an L3 leaf (named after the top) under the shared
 *     L2 bucket `l2`.
 *
 * sourceMap keys are SourceCategory.externalId (exact DB link key) -> leaf slug.
 * Re-run after editing:  node src/sources/category-map/generate-map.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const nodes = JSON.parse(readFileSync(join(here, 'db-source-tree.json'), 'utf8'));

// L1 nav groups. Order controls storefront nav order.
const GROUPS = [
  { slug: 'bestsellers', name: 'Best Sellers' }, // empty leaf, filled manually
  { slug: 'writing', name: 'Pens & Writing' },
  { slug: 'drinkware', name: 'Drinkware' },
  { slug: 'bags', name: 'Bags & Travel' },
  { slug: 'apparel', name: 'Apparel & Headwear' },
  { slug: 'office', name: 'Office & Stationery' },
  { slug: 'tech', name: 'Technology' },
  { slug: 'awards', name: 'Awards & Recognition' },
  { slug: 'health', name: 'Health, Safety & Personal Care' },
  { slug: 'outdoor', name: 'Outdoor & Leisure' },
  { slug: 'home', name: 'Home & Kitchen' },
  { slug: 'tradeshow', name: 'Trade Show & Signage' },
  { slug: 'giveaways', name: 'Keyrings, Lanyards & Giveaways' },
  { slug: 'gifts', name: 'Gifts, Food & Confectionery' },
  { slug: 'auto', name: 'Auto & Motoring' },
];

// Exact DB top name -> { group slug, L2 name }. Every ASI top must appear here.
const TOP_MAP = {
  // ---- Pens & Writing --------------------------------------------------
  'Pens': { group: 'writing', l2: 'Pens' },
  'Pencils': { group: 'writing', l2: 'Pencils' },
  'Highlighters': { group: 'writing', l2: 'Highlighters & Markers' },
  'Markers': { group: 'writing', l2: 'Highlighters & Markers' },
  'Pen & Pencil Sets': { group: 'writing', l2: 'Writing Sets & Accessories' },
  'Pen & Pencil Accessories': { group: 'writing', l2: 'Writing Sets & Accessories' },
  'Pen & Pencil Holders': { group: 'writing', l2: 'Writing Sets & Accessories' },
  'Boxes & Cases-pen & Pencil': { group: 'writing', l2: 'Writing Sets & Accessories' },
  'Desk Pen Stands': { group: 'writing', l2: 'Writing Sets & Accessories' },
  'Erasers': { group: 'writing', l2: 'Writing Sets & Accessories' },
  'Sharpeners': { group: 'writing', l2: 'Writing Sets & Accessories' },
  'Pointers': { group: 'writing', l2: 'Writing Sets & Accessories' },

  // ---- Drinkware -------------------------------------------------------
  'Bottles': { group: 'drinkware', l2: 'Water Bottles' },
  'Flasks': { group: 'drinkware', l2: 'Flasks & Canteens' },
  'Canteens': { group: 'drinkware', l2: 'Flasks & Canteens' },
  'Jugs': { group: 'drinkware', l2: 'Flasks & Canteens' },
  'Travel Mugs/cups': { group: 'drinkware', l2: 'Travel Mugs & Cups' },
  'Mugs & Steins': { group: 'drinkware', l2: 'Mugs & Steins' },
  'Coffee Pots': { group: 'drinkware', l2: 'Coffee & Tea' },
  'Teapots/sets/infusers': { group: 'drinkware', l2: 'Coffee & Tea' },
  'Tea Or Coffee Sets': { group: 'drinkware', l2: 'Coffee & Tea' },
  'Glasses-drinking': { group: 'drinkware', l2: 'Glassware' },
  'Wine Glasses': { group: 'drinkware', l2: 'Glassware' },
  'Shot Glasses': { group: 'drinkware', l2: 'Glassware' },
  'Pitchers': { group: 'drinkware', l2: 'Pitchers & Carafes' },
  'Pitcher Sets': { group: 'drinkware', l2: 'Pitchers & Carafes' },
  'Carafes & Carafe Sets': { group: 'drinkware', l2: 'Pitchers & Carafes' },
  'Decanters': { group: 'drinkware', l2: 'Pitchers & Carafes' },
  'Decanter Sets': { group: 'drinkware', l2: 'Pitchers & Carafes' },
  'Cups': { group: 'drinkware', l2: 'Cups & Tumblers' },
  'Stadium Cups': { group: 'drinkware', l2: 'Cups & Tumblers' },
  'Bar Accessories': { group: 'drinkware', l2: 'Barware' },
  'Corkscrews': { group: 'drinkware', l2: 'Barware' },
  'Wine Accessories': { group: 'drinkware', l2: 'Barware' },
  'Wine Chillers': { group: 'drinkware', l2: 'Barware' },
  'Drink Mixers & Shakers': { group: 'drinkware', l2: 'Barware' },
  'Stirrers & Sticks-drink': { group: 'drinkware', l2: 'Barware' },
  'Straws': { group: 'drinkware', l2: 'Barware' },
  'Ice Buckets': { group: 'drinkware', l2: 'Barware' },
  'Ice Cubes': { group: 'drinkware', l2: 'Barware' },
  'Ice Cube Trays': { group: 'drinkware', l2: 'Barware' },
  'Openers': { group: 'drinkware', l2: 'Bottle Openers' },
  'Beverage Holders': { group: 'drinkware', l2: 'Can Coolers & Koozies' },
  'Coasters & Coaster Sets': { group: 'drinkware', l2: 'Coasters' },

  // ---- Bags & Travel ---------------------------------------------------
  'Bags': { group: 'bags', l2: 'Bags' },
  'Tote Bags': { group: 'bags', l2: 'Tote Bags' },
  'Backpacks': { group: 'bags', l2: 'Backpacks' },
  'Duffel Bags': { group: 'bags', l2: 'Duffel & Sports Bags' },
  'Coolers': { group: 'bags', l2: 'Cooler Bags' },
  'Briefcases': { group: 'bags', l2: 'Business & Laptop Bags' },
  'Messenger Bags': { group: 'bags', l2: 'Business & Laptop Bags' },
  'Laptop Sleeves/cases': { group: 'bags', l2: 'Business & Laptop Bags' },
  'Deposit Bags': { group: 'bags', l2: 'Utility Bags' },
  'Pouches': { group: 'bags', l2: 'Pouches' },
  'Cosmetic Bags': { group: 'bags', l2: 'Cosmetic & Toiletry Bags' },
  'Coin Purses': { group: 'bags', l2: 'Wallets & Purses' },
  'Purses': { group: 'bags', l2: 'Wallets & Purses' },
  'Wallets': { group: 'bags', l2: 'Wallets & Purses' },
  'Money Clips': { group: 'bags', l2: 'Wallets & Purses' },
  'Luggage': { group: 'bags', l2: 'Luggage & Travel' },
  'Luggage Sets': { group: 'bags', l2: 'Luggage & Travel' },
  'Luggage Tags': { group: 'bags', l2: 'Luggage & Travel' },
  'Garment Bags': { group: 'bags', l2: 'Luggage & Travel' },
  'Travel Amenities': { group: 'bags', l2: 'Luggage & Travel' },
  'Hydration Bags': { group: 'bags', l2: 'Luggage & Travel' },
  'Carriers': { group: 'bags', l2: 'Luggage & Travel' },

  // ---- Apparel & Headwear ---------------------------------------------
  'T-shirts': { group: 'apparel', l2: 'T-Shirts' },
  'Golf/polo Shirts': { group: 'apparel', l2: 'Polo Shirts' },
  'Shirts': { group: 'apparel', l2: 'Shirts' },
  'Sweat Shirts': { group: 'apparel', l2: 'Sweatshirts & Hoodies' },
  'Sweaters': { group: 'apparel', l2: 'Sweaters' },
  'Jackets': { group: 'apparel', l2: 'Jackets' },
  'Vests': { group: 'apparel', l2: 'Vests' },
  'Performance Apparel': { group: 'apparel', l2: 'Activewear' },
  'Exercise Clothes': { group: 'apparel', l2: 'Activewear' },
  'Outerwear-rainwear': { group: 'apparel', l2: 'Outerwear & Rainwear' },
  'Uniforms': { group: 'apparel', l2: 'Uniforms & Workwear' },
  'Clothing': { group: 'apparel', l2: 'Casual Wear' },
  'Aprons': { group: 'apparel', l2: 'Aprons & Bibs' },
  'Bibs': { group: 'apparel', l2: 'Aprons & Bibs' },
  'Robes': { group: 'apparel', l2: 'Robes & Loungewear' },
  'Slippers': { group: 'apparel', l2: 'Robes & Loungewear' },
  'Shorts': { group: 'apparel', l2: 'Bottoms' },
  'Belts': { group: 'apparel', l2: 'Belts & Accessories' },
  'Socks': { group: 'apparel', l2: 'Socks & Hosiery' },
  'Shoes': { group: 'apparel', l2: 'Footwear' },
  'Gloves': { group: 'apparel', l2: 'Gloves & Mittens' },
  'Scarves': { group: 'apparel', l2: 'Scarves & Bandannas' },
  'Bandannas': { group: 'apparel', l2: 'Scarves & Bandannas' },
  'Headbands': { group: 'apparel', l2: 'Headwear Accessories' },
  'Arm Bands': { group: 'apparel', l2: 'Headwear Accessories' },
  'Cap & Hat Accessories': { group: 'apparel', l2: 'Headwear Accessories' },
  'Caps & Hats': { group: 'apparel', l2: 'Caps & Hats' },
  'Baseball Caps': { group: 'apparel', l2: 'Baseball Caps' },
  'Sunglasses': { group: 'apparel', l2: 'Sunglasses & Eyewear' },
  'Eyeglasses': { group: 'apparel', l2: 'Sunglasses & Eyewear' },
  'Eyeglass Accessories': { group: 'apparel', l2: 'Sunglasses & Eyewear' },
  'Eyeglass Cases & Holders': { group: 'apparel', l2: 'Sunglasses & Eyewear' },
  'Eyeglass Cleaners': { group: 'apparel', l2: 'Sunglasses & Eyewear' },

  // ---- Office & Stationery --------------------------------------------
  'Notebooks': { group: 'office', l2: 'Notebooks' },
  'Journals & Diaries': { group: 'office', l2: 'Journals & Diaries' },
  'Memo Pads': { group: 'office', l2: 'Sticky Notes & Memo Pads' },
  'Memo Pad & Paper Holders': { group: 'office', l2: 'Sticky Notes & Memo Pads' },
  'Memo Holders': { group: 'office', l2: 'Sticky Notes & Memo Pads' },
  'Calendar Pads': { group: 'office', l2: 'Sticky Notes & Memo Pads' },
  'Pads': { group: 'office', l2: 'Sticky Notes & Memo Pads' },
  'Tape Flags': { group: 'office', l2: 'Sticky Notes & Memo Pads' },
  'Calendars': { group: 'office', l2: 'Calendars' },
  'Planners & Organizers': { group: 'office', l2: 'Planners & Organizers' },
  'Organizers': { group: 'office', l2: 'Planners & Organizers' },
  'Portfolios': { group: 'office', l2: 'Portfolios & Padfolios' },
  'Pad Folios': { group: 'office', l2: 'Portfolios & Padfolios' },
  'Desk Accessories': { group: 'office', l2: 'Desk Accessories' },
  'Paperweights': { group: 'office', l2: 'Desk Accessories' },
  'Letter Openers': { group: 'office', l2: 'Desk Accessories' },
  'Business Card Holders': { group: 'office', l2: 'Desk Accessories' },
  'Book Ends & Racks': { group: 'office', l2: 'Desk Accessories' },
  'Bookmarks': { group: 'office', l2: 'Desk Accessories' },
  'Office Supplies': { group: 'office', l2: 'Office Supplies' },
  'Office Equipment': { group: 'office', l2: 'Office Supplies' },
  'Staplers': { group: 'office', l2: 'Office Supplies' },
  'Tape Dispensers': { group: 'office', l2: 'Office Supplies' },
  'Rulers': { group: 'office', l2: 'Office Supplies' },
  'Clipboards': { group: 'office', l2: 'Office Supplies' },
  'Binders': { group: 'office', l2: 'Office Supplies' },
  'Scissors & Shears': { group: 'office', l2: 'Office Supplies' },
  'Cutters': { group: 'office', l2: 'Office Supplies' },
  'Carton Cutters': { group: 'office', l2: 'Office Supplies' },
  'Fasteners': { group: 'office', l2: 'Office Supplies' },
  'Glue': { group: 'office', l2: 'Office Supplies' },
  'Paper': { group: 'office', l2: 'Office Supplies' },
  'Paper Specialties': { group: 'office', l2: 'Office Supplies' },
  'Stamps': { group: 'office', l2: 'Office Supplies' },
  'Card Sleeves': { group: 'office', l2: 'Office Supplies' },
  'Clips-utility': { group: 'office', l2: 'Office Supplies' },
  'Boards': { group: 'office', l2: 'Whiteboards & Boards' },
  'Write On-wipe Off Boards': { group: 'office', l2: 'Whiteboards & Boards' },
  'Labels': { group: 'office', l2: 'Labels' },
  'Business Cards': { group: 'office', l2: 'Business Cards & Printing' },
  'Cards': { group: 'office', l2: 'Business Cards & Printing' },
  'Nameplates': { group: 'office', l2: 'Desk Accessories' },

  // ---- Technology ------------------------------------------------------
  'Battery Rechargers & Adaptors': { group: 'tech', l2: 'Power Banks & Chargers' },
  'Usb/flash Drives': { group: 'tech', l2: 'USB Drives' },
  'Usb Hubs': { group: 'tech', l2: 'USB Drives' },
  'Speakers': { group: 'tech', l2: 'Speakers' },
  'Headphones': { group: 'tech', l2: 'Headphones & Earbuds' },
  'Mobile Accessories': { group: 'tech', l2: 'Phone & Tablet' },
  'Phones': { group: 'tech', l2: 'Phone & Tablet' },
  'Tablet & E-reader Sleeves & Cases': { group: 'tech', l2: 'Phone & Tablet' },
  'Palms/pda Accessories': { group: 'tech', l2: 'Phone & Tablet' },
  'Bluetooth Trackers & Gps Devices': { group: 'tech', l2: 'Trackers & GPS' },
  'Bluetooth Trackers & Gps Device Accessories': { group: 'tech', l2: 'Trackers & GPS' },
  'Computer Accessories': { group: 'tech', l2: 'Computer Accessories' },
  'Mouse Pads': { group: 'tech', l2: 'Computer Accessories' },
  'Cameras': { group: 'tech', l2: 'Cameras & Photo' },
  'Camera Cases': { group: 'tech', l2: 'Cameras & Photo' },
  'Photography/darkroom Accessories': { group: 'tech', l2: 'Cameras & Photo' },
  'Drones': { group: 'tech', l2: 'Cameras & Photo' },
  'Video Equipment': { group: 'tech', l2: 'Cameras & Photo' },
  'Electronic Devices': { group: 'tech', l2: 'Gadgets & Electronics' },
  'Radios': { group: 'tech', l2: 'Gadgets & Electronics' },
  'Recorders': { group: 'tech', l2: 'Gadgets & Electronics' },
  'Cds/dvds/players': { group: 'tech', l2: 'Gadgets & Electronics' },
  "Tv's & Tv Accessories": { group: 'tech', l2: 'Gadgets & Electronics' },
  'Calculators': { group: 'tech', l2: 'Gadgets & Electronics' },

  // ---- Awards & Recognition -------------------------------------------
  'Awards': { group: 'awards', l2: 'Awards & Trophies' },
  'Plaques': { group: 'awards', l2: 'Plaques' },
  'Medals': { group: 'awards', l2: 'Medals' },
  'Certificate Holders & Frames': { group: 'awards', l2: 'Certificates & Frames' },
  'Badges & Name Tags': { group: 'awards', l2: 'Name Badges' },
  'Lapel Pins': { group: 'awards', l2: 'Lapel Pins & Emblems' },
  'Pins': { group: 'awards', l2: 'Lapel Pins & Emblems' },
  'Buttons': { group: 'awards', l2: 'Buttons & Badges' },
  'Coins-tokens & Medallions': { group: 'awards', l2: 'Coins & Medallions' },

  // ---- Health, Safety & Personal Care ---------------------------------
  'Antibacterial Products': { group: 'health', l2: 'Hand Sanitizer & Antibacterial' },
  'Antimicrobial Enhanced Products': { group: 'health', l2: 'Hand Sanitizer & Antibacterial' },
  'Uv Sanitizers': { group: 'health', l2: 'Hand Sanitizer & Antibacterial' },
  'Towelettes': { group: 'health', l2: 'Hand Sanitizer & Antibacterial' },
  'Masks': { group: 'health', l2: 'Face Masks & PPE' },
  'Earplugs': { group: 'health', l2: 'Face Masks & PPE' },
  'Bandages': { group: 'health', l2: 'First Aid' },
  'Medical Supplies': { group: 'health', l2: 'First Aid' },
  'Physical & Therapeutic Aids': { group: 'health', l2: 'First Aid' },
  'Heating Pads': { group: 'health', l2: 'First Aid' },
  'Ice Packs': { group: 'health', l2: 'First Aid' },
  'Pill Boxes & Bottles': { group: 'health', l2: 'First Aid' },
  'Thermometers': { group: 'health', l2: 'First Aid' },
  'Lip Balm': { group: 'health', l2: 'Lip Balm & Sun Care' },
  'Sunscreen': { group: 'health', l2: 'Lip Balm & Sun Care' },
  'Suntan Lotions': { group: 'health', l2: 'Lip Balm & Sun Care' },
  'Beauty Aids': { group: 'health', l2: 'Beauty & Personal Care' },
  'Compacts & Pocket Mirrors': { group: 'health', l2: 'Beauty & Personal Care' },
  'Combs': { group: 'health', l2: 'Beauty & Personal Care' },
  'Hair Brushes': { group: 'health', l2: 'Beauty & Personal Care' },
  'Brushes': { group: 'health', l2: 'Beauty & Personal Care' },
  'Mirrors': { group: 'health', l2: 'Beauty & Personal Care' },
  'Razors & Electric Shavers': { group: 'health', l2: 'Beauty & Personal Care' },
  'Shaving Accessories & Kits': { group: 'health', l2: 'Beauty & Personal Care' },
  'Lipsticks & Lipstick Cases': { group: 'health', l2: 'Beauty & Personal Care' },
  'Spa Products': { group: 'health', l2: 'Beauty & Personal Care' },
  'Massagers': { group: 'health', l2: 'Beauty & Personal Care' },
  'Toothbrushes': { group: 'health', l2: 'Oral Care' },
  'Toothpaste': { group: 'health', l2: 'Oral Care' },
  'Dental Floss': { group: 'health', l2: 'Oral Care' },
  'Alarms & Protective Devices': { group: 'health', l2: 'Safety & Protection' },
  'Whistles': { group: 'health', l2: 'Safety & Protection' },
  'Reflectors': { group: 'health', l2: 'Safety & Protection' },
  'Identity Protection Products': { group: 'health', l2: 'Safety & Protection' },
  'Insect Repellents & Exterminators': { group: 'health', l2: 'Safety & Protection' },
  'Gun & Gun Accessories': { group: 'health', l2: 'Safety & Protection' },

  // ---- Outdoor & Leisure ----------------------------------------------
  'Golf Accessories': { group: 'outdoor', l2: 'Golf' },
  'Golf Balls': { group: 'outdoor', l2: 'Golf' },
  'Golf Bags': { group: 'outdoor', l2: 'Golf' },
  'Golf Clubs': { group: 'outdoor', l2: 'Golf' },
  'Golf Putters': { group: 'outdoor', l2: 'Golf' },
  'Golf Tees': { group: 'outdoor', l2: 'Golf' },
  'Sports Equipment & Access.': { group: 'outdoor', l2: 'Sports & Fitness' },
  'Balls': { group: 'outdoor', l2: 'Sports & Fitness' },
  'Volleyballs': { group: 'outdoor', l2: 'Sports & Fitness' },
  'Tennis Balls': { group: 'outdoor', l2: 'Sports & Fitness' },
  'Exercise Equipment': { group: 'outdoor', l2: 'Sports & Fitness' },
  'Cheering Accessories': { group: 'outdoor', l2: 'Sports & Fitness' },
  'Sports Schedules': { group: 'outdoor', l2: 'Sports & Fitness' },
  'Nets': { group: 'outdoor', l2: 'Sports & Fitness' },
  'Camping Equipment': { group: 'outdoor', l2: 'Camping & Hiking' },
  'Tents': { group: 'outdoor', l2: 'Camping & Hiking' },
  'Canopies & Awnings': { group: 'outdoor', l2: 'Camping & Hiking' },
  'Hammocks': { group: 'outdoor', l2: 'Camping & Hiking' },
  'Compasses': { group: 'outdoor', l2: 'Camping & Hiking' },
  'Carabiners': { group: 'outdoor', l2: 'Camping & Hiking' },
  'Umbrellas': { group: 'outdoor', l2: 'Umbrellas' },
  'Blankets': { group: 'outdoor', l2: 'Blankets & Throws' },
  'Folding Seats': { group: 'outdoor', l2: 'Camp Chairs & Seating' },
  'Stadium Seats': { group: 'outdoor', l2: 'Camp Chairs & Seating' },
  'Stools': { group: 'outdoor', l2: 'Camp Chairs & Seating' },
  'Picnic Baskets & Kits': { group: 'outdoor', l2: 'Picnic & BBQ' },
  'Barbecue Accessories': { group: 'outdoor', l2: 'Picnic & BBQ' },
  'Grills': { group: 'outdoor', l2: 'Picnic & BBQ' },
  'Fire Pits': { group: 'outdoor', l2: 'Picnic & BBQ' },
  'Flying Saucers & Discs': { group: 'outdoor', l2: 'Beach & Yard Games' },
  'Kites': { group: 'outdoor', l2: 'Beach & Yard Games' },
  'Games': { group: 'outdoor', l2: 'Games' },
  'Playing Cards': { group: 'outdoor', l2: 'Games' },
  'Puzzles & Tricks': { group: 'outdoor', l2: 'Puzzles & Tricks' },
  'Poker Chips': { group: 'outdoor', l2: 'Games' },
  'Dice Specialties': { group: 'outdoor', l2: 'Games' },
  "Yo-yo's": { group: 'outdoor', l2: 'Games' },
  'Tops & Spinners': { group: 'outdoor', l2: 'Games' },
  'Game Parts': { group: 'outdoor', l2: 'Games' },
  'Flashlights': { group: 'outdoor', l2: 'Flashlights & Lighting' },
  'Lights': { group: 'outdoor', l2: 'Flashlights & Lighting' },
  'Lanterns': { group: 'outdoor', l2: 'Flashlights & Lighting' },
  'Glow Products': { group: 'outdoor', l2: 'Flashlights & Lighting' },
  'Light Up Novelties': { group: 'outdoor', l2: 'Flashlights & Lighting' },
  'Book Lights': { group: 'outdoor', l2: 'Flashlights & Lighting' },
  'Led Products': { group: 'outdoor', l2: 'Flashlights & Lighting' },
  'Light Bulbs': { group: 'outdoor', l2: 'Flashlights & Lighting' },
  'Bicycle Accessories': { group: 'outdoor', l2: 'Cycling' },
  'Towels': { group: 'outdoor', l2: 'Towels' },
  'Cooling Towels & Scarves': { group: 'outdoor', l2: 'Towels' },

  // ---- Home & Kitchen --------------------------------------------------
  'Tools-kitchen': { group: 'home', l2: 'Kitchen Tools & Gadgets' },
  'Measuring Cups & Spoons': { group: 'home', l2: 'Kitchen Tools & Gadgets' },
  'Salad Sets': { group: 'home', l2: 'Kitchen Tools & Gadgets' },
  'Salt & Pepper Shakers And Mills': { group: 'home', l2: 'Kitchen Tools & Gadgets' },
  'Trivets': { group: 'home', l2: 'Kitchen Tools & Gadgets' },
  'Pot Holders & Oven Mitts': { group: 'home', l2: 'Kitchen Tools & Gadgets' },
  'Scoops': { group: 'home', l2: 'Kitchen Tools & Gadgets' },
  'Funnels': { group: 'home', l2: 'Kitchen Tools & Gadgets' },
  'Cookware & Bakeware': { group: 'home', l2: 'Cookware & Bakeware' },
  'Forks & Spoons': { group: 'home', l2: 'Flatware & Utensils' },
  'Flatware': { group: 'home', l2: 'Flatware & Utensils' },
  'Dishes & Dish Sets': { group: 'home', l2: 'Dishes & Serveware' },
  'Bowls': { group: 'home', l2: 'Dishes & Serveware' },
  'Plates': { group: 'home', l2: 'Dishes & Serveware' },
  'Trays': { group: 'home', l2: 'Dishes & Serveware' },
  'Napkins': { group: 'home', l2: 'Table Linens' },
  'Tablecloths & Tablecloth Sets': { group: 'home', l2: 'Table Linens' },
  'Bag Clips & Sealers': { group: 'home', l2: 'Kitchen Storage' },
  'Canisters': { group: 'home', l2: 'Kitchen Storage' },
  'Jars': { group: 'home', l2: 'Kitchen Storage' },
  'Apothecary Jars': { group: 'home', l2: 'Kitchen Storage' },
  'Tins': { group: 'home', l2: 'Kitchen Storage' },
  'Candles & Incense & Potpourri': { group: 'home', l2: 'Candles & Fragrance' },
  'Candle Holders': { group: 'home', l2: 'Candles & Fragrance' },
  'Fresheners': { group: 'home', l2: 'Candles & Fragrance' },
  'Warmers': { group: 'home', l2: 'Candles & Fragrance' },
  'Deodorizers': { group: 'home', l2: 'Candles & Fragrance' },
  'Picture Frames': { group: 'home', l2: 'Home Decor' },
  'Frames': { group: 'home', l2: 'Home Decor' },
  'Vases': { group: 'home', l2: 'Home Decor' },
  'Figurines': { group: 'home', l2: 'Home Decor' },
  'Miniatures & Replicas': { group: 'home', l2: 'Home Decor' },
  'Ornaments': { group: 'home', l2: 'Home Decor' },
  'Wall Tapestries & Murals': { group: 'home', l2: 'Home Decor' },
  'Globes': { group: 'home', l2: 'Home Decor' },
  'Clocks': { group: 'home', l2: 'Clocks' },
  'Crystal Products': { group: 'home', l2: 'Crystal & Glass Gifts' },
  'Crystal Balls': { group: 'home', l2: 'Crystal & Glass Gifts' },
  'Pillows': { group: 'home', l2: 'Bedding & Bath' },
  'Rugs': { group: 'home', l2: 'Bedding & Bath' },
  'Mats': { group: 'home', l2: 'Bedding & Bath' },
  'Curtains & Draperies & Shades': { group: 'home', l2: 'Bedding & Bath' },
  'Bedroom Accessories': { group: 'home', l2: 'Bedding & Bath' },
  'Bathroom Accessories': { group: 'home', l2: 'Bedding & Bath' },
  'Sponges & Sponge Holders': { group: 'home', l2: 'Cleaning' },
  'Cleaners': { group: 'home', l2: 'Cleaning' },
  'Microfiber Cloths': { group: 'home', l2: 'Cleaning' },
  'Brooms-mops & Vacuums': { group: 'home', l2: 'Cleaning' },
  'Dispensers': { group: 'home', l2: 'Cleaning' },
  'Tissues': { group: 'home', l2: 'Cleaning' },
  'Containers': { group: 'home', l2: 'Storage & Organization' },
  'Boxes': { group: 'home', l2: 'Storage & Organization' },
  'Baskets': { group: 'home', l2: 'Storage & Organization' },
  'Buckets': { group: 'home', l2: 'Storage & Organization' },
  'Trash Cans': { group: 'home', l2: 'Storage & Organization' },
  'Hooks': { group: 'home', l2: 'Storage & Organization' },
  'Stands': { group: 'home', l2: 'Storage & Organization' },
  'Cases & Holders': { group: 'home', l2: 'Storage & Organization' },
  'Display Cases': { group: 'home', l2: 'Storage & Organization' },
  'Lawn & Garden Accessories': { group: 'home', l2: 'Garden & Outdoor Living' },
  'Plants & Seeds & Flowers': { group: 'home', l2: 'Garden & Outdoor Living' },
  'Planters': { group: 'home', l2: 'Garden & Outdoor Living' },
  'Furniture': { group: 'home', l2: 'Furniture' },
  'Tables': { group: 'home', l2: 'Furniture' },
  'Pet Items': { group: 'home', l2: 'Pet Supplies' },
  'Tools-hardware': { group: 'home', l2: 'Tools & Hardware' },
  'Tool Boxes': { group: 'home', l2: 'Tools & Hardware' },
  'Tool Kits': { group: 'home', l2: 'Tools & Hardware' },
  'Tape Measures': { group: 'home', l2: 'Tools & Hardware' },
  'Measuring Devices': { group: 'home', l2: 'Tools & Hardware' },
  'Scrapers': { group: 'home', l2: 'Tools & Hardware' },
  'Grippers': { group: 'home', l2: 'Tools & Hardware' },
  'Magnifiers': { group: 'home', l2: 'Tools & Hardware' },
  'Inflators': { group: 'home', l2: 'Tools & Hardware' },
  'Humidifiers & Dehumidifiers': { group: 'home', l2: 'Home Appliances' },
  'Fans': { group: 'home', l2: 'Home Appliances' },
  'Timers': { group: 'home', l2: 'Home Appliances' },
  'Scales': { group: 'home', l2: 'Home Appliances' },
  'Lamps': { group: 'home', l2: 'Lighting & Lamps' },

  // ---- Trade Show & Signage -------------------------------------------
  'Banners': { group: 'tradeshow', l2: 'Banners' },
  'Signs & Displays': { group: 'tradeshow', l2: 'Signs & Displays' },
  'Sign & Display Accessories': { group: 'tradeshow', l2: 'Signs & Displays' },
  'Trade Show Displays': { group: 'tradeshow', l2: 'Trade Show Displays' },
  'Flags': { group: 'tradeshow', l2: 'Flags' },
  'Flag Accessories': { group: 'tradeshow', l2: 'Flags' },
  'Decals': { group: 'tradeshow', l2: 'Decals & Stickers' },
  'Bumper Stickers': { group: 'tradeshow', l2: 'Decals & Stickers' },
  'Magnets': { group: 'tradeshow', l2: 'Magnets' },
  'Pamphlets/brochures/catalogs': { group: 'tradeshow', l2: 'Printed Materials' },
  'Parking Permits': { group: 'tradeshow', l2: 'Printed Materials' },

  // ---- Keyrings, Lanyards & Giveaways ---------------------------------
  'Key Chains': { group: 'giveaways', l2: 'Keychains' },
  'Lanyards': { group: 'giveaways', l2: 'Lanyards' },
  'Badge Holders': { group: 'giveaways', l2: 'Badge Holders & Reels' },
  'Wristbands': { group: 'giveaways', l2: 'Wristbands' },
  'Stress Relievers': { group: 'giveaways', l2: 'Stress Toys' },
  'Custom Products': { group: 'giveaways', l2: 'Custom & Assorted' },
  'Kits': { group: 'giveaways', l2: 'Promo Kits' },
  'Patches': { group: 'giveaways', l2: 'Patches & Emblems' },
  'Foam Novelties': { group: 'giveaways', l2: 'Foam & Fun Novelties' },
  'Noisemakers': { group: 'giveaways', l2: 'Foam & Fun Novelties' },
  'Inflatable Accessories': { group: 'giveaways', l2: 'Foam & Fun Novelties' },
  'Costumes & Accessories': { group: 'giveaways', l2: 'Foam & Fun Novelties' },
  'Adult Novelties': { group: 'giveaways', l2: 'Novelties' },
  '3-d Products': { group: 'giveaways', l2: 'Novelties' },
  'Movie/clapboard Specialties': { group: 'giveaways', l2: 'Novelties' },
  'Weather Predictors': { group: 'giveaways', l2: 'Novelties' },

  // ---- Gifts, Food & Confectionery ------------------------------------
  'Food Gifts': { group: 'gifts', l2: 'Food Gifts' },
  'Candy': { group: 'gifts', l2: 'Candy & Confectionery' },
  'Beverages': { group: 'gifts', l2: 'Beverages' },
  'Gift Sets': { group: 'gifts', l2: 'Gift Sets' },
  'Gift Wrap': { group: 'gifts', l2: 'Gift Wrap & Packaging' },
  'Packaging Boxes': { group: 'gifts', l2: 'Gift Wrap & Packaging' },
  'Special Packaging': { group: 'gifts', l2: 'Gift Wrap & Packaging' },
  'Greeting Cards': { group: 'gifts', l2: 'Cards & Stationery' },
  'Post Cards': { group: 'gifts', l2: 'Cards & Stationery' },
  'Books': { group: 'gifts', l2: 'Books & Publications' },
  'Almanacs': { group: 'gifts', l2: 'Books & Publications' },
  'Coloring & Activity Books': { group: 'gifts', l2: 'Books & Publications' },
  'Toys': { group: 'gifts', l2: 'Toys & Plush' },
  'Stuffed Animals & Toys': { group: 'gifts', l2: 'Toys & Plush' },
  'Stuffed Animals & Toys Accessories': { group: 'gifts', l2: 'Toys & Plush' },
  'Baby Items': { group: 'gifts', l2: 'Baby & Kids' },
  'Jewelry': { group: 'gifts', l2: 'Jewelry & Watches' },
  'Bracelets': { group: 'gifts', l2: 'Jewelry & Watches' },
  'Charms': { group: 'gifts', l2: 'Jewelry & Watches' },
  'Watches': { group: 'gifts', l2: 'Jewelry & Watches' },
  'Jewelry Boxes & Rolls': { group: 'gifts', l2: 'Jewelry & Watches' },
  'Lighters': { group: 'gifts', l2: 'Lighters & Smoking' },
  'Matches': { group: 'gifts', l2: 'Lighters & Smoking' },
  'Match-folder Specialties': { group: 'gifts', l2: 'Lighters & Smoking' },
  'Tobacco Related Products': { group: 'gifts', l2: 'Lighters & Smoking' },
  'Musical Instruments & Accessories': { group: 'gifts', l2: 'Music & Party' },

  // ---- Auto & Motoring -------------------------------------------------
  'Auto Accessories': { group: 'auto', l2: 'Auto Accessories' },
  'Auto Visor Accessories': { group: 'auto', l2: 'Auto Accessories' },
  'Car Sun Shades': { group: 'auto', l2: 'Auto Accessories' },
  'Ice Scrapers': { group: 'auto', l2: 'Auto Accessories' },
  'Coin Holders': { group: 'auto', l2: 'Auto Accessories' },
  'License Plate Holders': { group: 'auto', l2: 'License Plates & Frames' },
  'License Plates': { group: 'auto', l2: 'License Plates & Frames' },
  'Tire Gauges': { group: 'auto', l2: 'Auto Care' },

  // ---- Long-tail / misc ------------------------------------------------
  'Knives': { group: 'outdoor', l2: 'Knives & Multi-Tools' },
  'Covers': { group: 'home', l2: 'Storage & Organization' },
  'Tags': { group: 'office', l2: 'Labels' },
  'Toothpicks': { group: 'home', l2: 'Kitchen Tools & Gadgets' },
  'Lids & Caps': { group: 'drinkware', l2: 'Barware' },
  'Sewing Accessories & Kits': { group: 'home', l2: 'Sewing & Crafts' },
  'Art Supplies': { group: 'office', l2: 'Art & Craft Supplies' },
  'Straps': { group: 'apparel', l2: 'Belts & Accessories' },
  'Fireplace & Fireplace Accessories': { group: 'home', l2: 'Garden & Outdoor Living' },
  'Valuable Paper Holders': { group: 'office', l2: 'Desk Accessories' },
  'Letters & Numerals & Symbols': { group: 'tradeshow', l2: 'Signs & Displays' },
  'Carts': { group: 'home', l2: 'Furniture' },
  'Protectors': { group: 'health', l2: 'Safety & Protection' },
  'Polishers': { group: 'home', l2: 'Cleaning' },
  'Gavels': { group: 'awards', l2: 'Awards & Trophies' },

  // ---- Long-tail added after later syncs --------------------------------
  'Yardsticks': { group: 'office', l2: 'Office Supplies' },
  'Banks': { group: 'home', l2: 'Home Decor' },
  'Straw Toppers': { group: 'drinkware', l2: 'Barware' },
  'Zipper Pullers': { group: 'apparel', l2: 'Belts & Accessories' },
  'Pedometers': { group: 'outdoor', l2: 'Sports & Fitness' },
  'Seat Cushions': { group: 'outdoor', l2: 'Camp Chairs & Seating' },
  'Gauges': { group: 'home', l2: 'Tools & Hardware' },
  'Barometers & Hygrometers': { group: 'home', l2: 'Home Appliances' },
  'Beach Balls': { group: 'outdoor', l2: 'Beach & Yard Games' },
  'Cabinets': { group: 'home', l2: 'Furniture' },
  'Laundry Aids': { group: 'home', l2: 'Cleaning' },
  'Shoelaces': { group: 'apparel', l2: 'Footwear' },
  'Decorations': { group: 'home', l2: 'Home Decor' },
  'Flyswatters': { group: 'home', l2: 'Garden & Outdoor Living' },
  'Back Scratchers': { group: 'giveaways', l2: 'Novelties' },
  'Party Favors': { group: 'gifts', l2: 'Music & Party' },
  'Necklaces': { group: 'gifts', l2: 'Jewelry & Watches' },
  'Footballs': { group: 'outdoor', l2: 'Sports & Fitness' },
  'Folders': { group: 'office', l2: 'Portfolios & Padfolios' },
  'Soap': { group: 'health', l2: 'Beauty & Personal Care' },
  'Pennants': { group: 'tradeshow', l2: 'Flags' },
  'Charts': { group: 'tradeshow', l2: 'Printed Materials' },
  'Crayons': { group: 'office', l2: 'Art & Craft Supplies' },
  'Lint Removers': { group: 'home', l2: 'Cleaning' },
  'Ropes': { group: 'outdoor', l2: 'Camping & Hiking' },
  'Badge & Button Accessories/findings': { group: 'awards', l2: 'Buttons & Badges' },
  'Soap Dishes & Dispensers': { group: 'home', l2: 'Bedding & Bath' },
  'Extension Cords': { group: 'home', l2: 'Tools & Hardware' },
  'Wrist Rests': { group: 'tech', l2: 'Computer Accessories' },
  'Handbag Holders': { group: 'home', l2: 'Storage & Organization' },
  'Shoe Shine Kits': { group: 'apparel', l2: 'Footwear' },
  'Racks': { group: 'home', l2: 'Storage & Organization' },
  'Staple Removers': { group: 'office', l2: 'Office Supplies' },
  'Ribbon': { group: 'gifts', l2: 'Gift Wrap & Packaging' },
  'Shoehorns & Shoe Trees': { group: 'apparel', l2: 'Footwear' },
  'Purifiers': { group: 'home', l2: 'Home Appliances' },
  'Place Mats': { group: 'home', l2: 'Table Linens' },
  'Hangers': { group: 'home', l2: 'Storage & Organization' },
  'Flip Flops': { group: 'apparel', l2: 'Footwear' },
  'Bells': { group: 'gifts', l2: 'Music & Party' },
  'Goggles': { group: 'health', l2: 'Face Masks & PPE' },
  'Locks': { group: 'home', l2: 'Tools & Hardware' },
  'Belt Buckles': { group: 'apparel', l2: 'Belts & Accessories' },
  'Megaphones': { group: 'outdoor', l2: 'Sports & Fitness' },
  'Cookbooks': { group: 'gifts', l2: 'Books & Publications' },
  'Soccer Balls': { group: 'outdoor', l2: 'Sports & Fitness' },
  'Heaters': { group: 'home', l2: 'Home Appliances' },
  'Binoculars & Spotting Scopes': { group: 'outdoor', l2: 'Camping & Hiking' },
  'Sheets & Pillowcases': { group: 'home', l2: 'Bedding & Bath' },
  'Handles': { group: 'home', l2: 'Tools & Hardware' },
  'Basketballs': { group: 'outdoor', l2: 'Sports & Fitness' },
  'Seals': { group: 'office', l2: 'Office Supplies' },
  'Stones': { group: 'home', l2: 'Garden & Outdoor Living' },
  'Book Covers': { group: 'office', l2: 'Desk Accessories' },
  'Chalk': { group: 'office', l2: 'Art & Craft Supplies' },
  'Key Cases': { group: 'bags', l2: 'Wallets & Purses' },
  'Baseballs': { group: 'outdoor', l2: 'Sports & Fitness' },
  'Portfolio Sets': { group: 'office', l2: 'Portfolios & Padfolios' },
  'Candy Dishes': { group: 'home', l2: 'Dishes & Serveware' },
  'Tool Belts': { group: 'home', l2: 'Tools & Hardware' },
  'Squeegees': { group: 'home', l2: 'Cleaning' },
  'Envelopes': { group: 'office', l2: 'Office Supplies' },
  'Make-up/cosmetics': { group: 'health', l2: 'Beauty & Personal Care' },
  'Cowboy Hats': { group: 'apparel', l2: 'Caps & Hats' },
  'Trading Cards': { group: 'outdoor', l2: 'Games' },
  'Dustpans': { group: 'home', l2: 'Cleaning' },
  'Address Books': { group: 'office', l2: 'Journals & Diaries' },
  'Poker Sets': { group: 'outdoor', l2: 'Games' },
  'Invitations': { group: 'gifts', l2: 'Cards & Stationery' },
  'Fire Extinguishers': { group: 'health', l2: 'Safety & Protection' },
  'Sleeping Bags': { group: 'outdoor', l2: 'Camping & Hiking' },
  '3d & Virtual Reality Viewers': { group: 'tech', l2: 'Gadgets & Electronics' },
  'Mobile Apps': { group: 'tech', l2: 'Gadgets & Electronics' },
  'Tape': { group: 'office', l2: 'Office Supplies' },
  'Education Programs': { group: 'gifts', l2: 'Books & Publications' },
  'Balloons': { group: 'gifts', l2: 'Music & Party' },
  'Hacky Sacks': { group: 'outdoor', l2: 'Beach & Yard Games' },
  'Bulletin Boards': { group: 'office', l2: 'Whiteboards & Boards' },
  'Canes': { group: 'health', l2: 'First Aid' },
  'Napkin Rings & Holders': { group: 'home', l2: 'Table Linens' },
  'Earmuffs': { group: 'apparel', l2: 'Headwear Accessories' },
  'Coloring Sets': { group: 'office', l2: 'Art & Craft Supplies' },
  'World Timers': { group: 'home', l2: 'Clocks' },
};

const ALWAYS_CREATE = ['bestsellers'];

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const tops = nodes.filter((n) => n.level === 1);
const childrenByParent = {};
for (const n of nodes) if (n.level === 2) (childrenByParent[n.parent] ??= []).push(n);

const groupNodes = new Map(GROUPS.map((g) => [g.slug, { ...g, children: [] }]));
const sourceMap = {}; // externalId -> leaf slug
const skipped = [];

// L2 buckets we've materialized, keyed by `${group}:${l2}` -> L2 CuratedNode.
const l2ByKey = new Map();
const usedSlugs = new Set(GROUPS.map((g) => g.slug));

function uniqueSlug(base) {
  let s = base || 'x';
  let i = 2;
  while (usedSlugs.has(s)) s = `${base}-${i++}`;
  usedSlugs.add(s);
  return s;
}

function getL2(groupSlug, l2Name) {
  const key = `${groupSlug}:${l2Name}`;
  let node = l2ByKey.get(key);
  if (!node) {
    node = { slug: uniqueSlug('cat-' + slugify(l2Name)), name: l2Name, children: [] };
    l2ByKey.set(key, node);
    groupNodes.get(groupSlug).children.push(node);
  }
  return node;
}

for (const top of tops.sort((a, b) => b.products - a.products)) {
  const cfg = TOP_MAP[top.name];
  if (!cfg) { skipped.push(top.name); continue; }
  const group = groupNodes.get(cfg.group);
  if (!group) { skipped.push(`${top.name} (bad group ${cfg.group})`); continue; }
  const l2 = getL2(cfg.group, cfg.l2);
  const kids = (childrenByParent[top.ext] ?? []).sort((a, b) => b.products - a.products);

  if (kids.length === 0) {
    // Childless top -> an L3 leaf under the bucket.
    const leaf = { slug: uniqueSlug('leaf-' + slugify(top.name)), name: top.name };
    l2.children.push(leaf);
    sourceMap[top.ext] = leaf.slug;
  } else {
    // Top with children -> its children become L3 leaves under the bucket.
    for (const k of kids) {
      const leaf = { slug: uniqueSlug('leaf-' + slugify(top.name + '-' + k.name)), name: k.name };
      l2.children.push(leaf);
      sourceMap[k.ext] = leaf.slug;
    }
  }
}

// Order L2 categories within each group by their number of L3 children (desc;
// name breaks ties). L1 group order (GROUPS) and L3 leaf order (product count)
// are left untouched. sortOrder = index here, which apply-category-map persists.
for (const node of groupNodes.values()) {
  if (!node.children || node.children.length === 0) continue;
  node.children.sort(
    (a, b) =>
      (b.children?.length ?? 0) - (a.children?.length ?? 0) ||
      a.name.localeCompare(b.name),
  );
  node.children.forEach((l2, i) => { l2.sortOrder = i; });
}

// Assemble curatedTree in GROUPS order; drop empty groups (except alwaysCreate).
const curatedTree = [];
for (const g of GROUPS) {
  const node = groupNodes.get(g.slug);
  if (node.children.length === 0 && !ALWAYS_CREATE.includes(g.slug)) continue;
  if (node.children.length === 0) delete node.children; // e.g. bestsellers leaf
  curatedTree.push(node);
}

const header = `// AUTO-GENERATED by generate-map.mjs from db-source-tree.json.
// Edit GROUPS / TOP_MAP in the generator and re-run; do not hand-edit.
import type { CuratedNode, SourceMap } from './category-map.types';

/** Curated slugs to create even with no mapping (empty leaves). */
export const ALWAYS_CREATE: string[] = ${JSON.stringify(ALWAYS_CREATE)};

export const curatedTree: CuratedNode[] = ${JSON.stringify(curatedTree, null, 2)};

/** SourceCategory.externalId -> curated leaf slug. */
export const sourceMap: SourceMap = ${JSON.stringify(sourceMap, null, 2)};
`;

writeFileSync(join(here, 'category-map.data.ts'), header);

// Report.
process.stderr.write(
  `groups: ${curatedTree.length}\n` +
  `L2 categories: ${l2ByKey.size}\n` +
  `mapped leaves (externalId keys): ${Object.keys(sourceMap).length}\n` +
  `skipped tops (no mapping): ${skipped.length}\n` +
  (skipped.length ? '  ' + skipped.join('\n  ') + '\n' : ''),
);
