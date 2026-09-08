// AUTO-GENERATED. Source of truth: the "BP Category Hierarchy" sheet + the
// ASI→BP mapping reviewed in asi_to_bp_category_map.csv.
//
// `bpTree`  - the storefront taxonomy, in sheet order (Main > Sub > Sub-Sub).
//             Nodes named "Other" are NOT in the sheet: they exist because the
//             storefront renders products on LEAF categories only, so an ASI
//             category mapped to a node that has children (e.g. "Awards") needs
//             a leaf to land on. Rename them freely; only the slug matters.
// `asiMap`  - ASI source-category path -> BP leaf slug. Keys are names, not ids,
//             because ~8% of SourceCategory.externalId values are locally
//             generated and therefore differ between environments. A row is
//             resolved by its own path ("Awards > Crystal") first, then by its
//             root ("Awards"), so children inherit their parent's mapping.
// `UNMAPPED_ASI` - ASI categories deliberately left unmapped: too generic to
//             place in the BP tree (products keep their source-category links,
//             so mapping them later is a re-run away, no re-import).
//
// Regenerate/extend by editing this file directly, then re-run:
//   npm run apply:bp-category-map
import type { CuratedNode, SourceMap } from './category-map.types';

export const bpTree: CuratedNode[] = [
  {
    "slug": "best-sellers",
    "name": "Best Sellers",
    "children": [
      {
        "slug": "most-popular",
        "name": "Most Popular"
      },
      {
        "slug": "best-sellers-bags-and-totes",
        "name": "Bags & Totes"
      },
      {
        "slug": "t-shirts",
        "name": "T-shirts"
      },
      {
        "slug": "superhero-capes",
        "name": "Superhero Capes"
      },
      {
        "slug": "best-sellers-drinkware",
        "name": "Drinkware"
      },
      {
        "slug": "stationery",
        "name": "Stationery"
      },
      {
        "slug": "best-sellers-other",
        "name": "Other"
      }
    ]
  },
  {
    "slug": "drinkware",
    "name": "Drinkware",
    "children": [
      {
        "slug": "mugs",
        "name": "Mugs",
        "children": [
          {
            "slug": "ceramic-mugs",
            "name": "Ceramic Mugs"
          },
          {
            "slug": "metal-mugs",
            "name": "Metal Mugs"
          },
          {
            "slug": "travel-mugs",
            "name": "Travel Mugs"
          },
          {
            "slug": "enamel-mugs",
            "name": "Enamel Mugs"
          },
          {
            "slug": "campfire-mugs",
            "name": "Campfire Mugs"
          },
          {
            "slug": "mugs-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "tumblers-and-cups",
        "name": "Tumblers and Cups",
        "children": [
          {
            "slug": "tumblers",
            "name": "Tumblers"
          },
          {
            "slug": "plastic-cups-and-paper-cups",
            "name": "Plastic Cups & Paper Cups"
          },
          {
            "slug": "tumblers-and-cups-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "water-bottles",
        "name": "Water Bottles",
        "children": [
          {
            "slug": "sports-bottles",
            "name": "Sports Bottles"
          },
          {
            "slug": "growlers",
            "name": "Growlers"
          },
          {
            "slug": "vacuum-flasks-and-bottles",
            "name": "Vacuum Flasks & Bottles"
          },
          {
            "slug": "fruit-infusers",
            "name": "Fruit Infusers"
          },
          {
            "slug": "water-bottles-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "bar-glassware",
        "name": "Bar Glassware",
        "children": [
          {
            "slug": "beer-glasses",
            "name": "Beer Glasses"
          },
          {
            "slug": "mason-jars",
            "name": "Mason Jars"
          },
          {
            "slug": "hip-flasks",
            "name": "Hip Flasks"
          },
          {
            "slug": "pint-and-stein-glasses",
            "name": "Pint & Stein Glasses"
          },
          {
            "slug": "bar-glassware-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "accessories",
        "name": "Accessories",
        "children": [
          {
            "slug": "can-coolers-and-koozies",
            "name": "Can Coolers & Koozies"
          },
          {
            "slug": "bar-accessories",
            "name": "Bar Accessories"
          },
          {
            "slug": "ice-cubes",
            "name": "Ice Cubes"
          },
          {
            "slug": "stadium-cups",
            "name": "Stadium Cups"
          },
          {
            "slug": "wine-products",
            "name": "Wine Products"
          },
          {
            "slug": "straws",
            "name": "Straws"
          },
          {
            "slug": "accessories-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "drinkware-other",
        "name": "Other"
      }
    ]
  },
  {
    "slug": "pens",
    "name": "Pens",
    "children": [
      {
        "slug": "plastic-pens",
        "name": "Plastic Pens",
        "children": [
          {
            "slug": "ballpoint-pens",
            "name": "Ballpoint Pens"
          },
          {
            "slug": "stylus-pens",
            "name": "Stylus Pens"
          },
          {
            "slug": "banner-pens",
            "name": "Banner Pens"
          },
          {
            "slug": "highlighter-and-marker-pens",
            "name": "Highlighter & Marker Pens"
          },
          {
            "slug": "plastic-pens-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "metal-pens",
        "name": "Metal Pens",
        "children": [
          {
            "slug": "metal-pens-ballpoint-pens",
            "name": "Ballpoint Pens"
          },
          {
            "slug": "multi-function-pens",
            "name": "Multi-Function Pens"
          },
          {
            "slug": "metal-pens-stylus-pens",
            "name": "Stylus Pens"
          },
          {
            "slug": "led-pens",
            "name": "LED Pens"
          },
          {
            "slug": "metal-pens-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "corporate-pens",
        "name": "Corporate Pens",
        "children": [
          {
            "slug": "rollerball-pens",
            "name": "Rollerball Pens"
          },
          {
            "slug": "fountain-pens",
            "name": "Fountain Pens"
          },
          {
            "slug": "pen-gift-sets",
            "name": "Pen Gift Sets"
          },
          {
            "slug": "leather-pens",
            "name": "Leather Pens"
          },
          {
            "slug": "pen-display-boxes",
            "name": "Pen Display Boxes"
          },
          {
            "slug": "corporate-pens-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "wooden-pens",
        "name": "Wooden Pens"
      },
      {
        "slug": "pencils",
        "name": "Pencils",
        "children": [
          {
            "slug": "standard",
            "name": "Standard"
          },
          {
            "slug": "mechanical",
            "name": "Mechanical"
          },
          {
            "slug": "carpenter-pencils",
            "name": "Carpenter Pencils"
          },
          {
            "slug": "colouring-crayons",
            "name": "Colouring Crayons"
          },
          {
            "slug": "pencil-cases",
            "name": "Pencil Cases"
          },
          {
            "slug": "pencils-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "pens-other",
        "name": "Other"
      }
    ]
  },
  {
    "slug": "event-giveaways",
    "name": "Event Giveaways",
    "children": [
      {
        "slug": "novelty-and-foam",
        "name": "Novelty & Foam",
        "children": [
          {
            "slug": "hand-fans",
            "name": "Hand Fans"
          },
          {
            "slug": "games-and-puzzles",
            "name": "Games & Puzzles"
          },
          {
            "slug": "capes",
            "name": "Capes"
          },
          {
            "slug": "light-up",
            "name": "Light Up"
          },
          {
            "slug": "foam-hands",
            "name": "Foam Hands"
          },
          {
            "slug": "foam-products",
            "name": "Foam Products"
          },
          {
            "slug": "novelty-and-foam-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "stress-toys",
        "name": "Stress Toys",
        "children": [
          {
            "slug": "stress-balls",
            "name": "Stress Balls"
          },
          {
            "slug": "stress-animals",
            "name": "Stress Animals"
          },
          {
            "slug": "stress-toys-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "lanyards-and-wristbands",
        "name": "Lanyards & Wristbands",
        "children": [
          {
            "slug": "lanyards",
            "name": "Lanyards"
          },
          {
            "slug": "badge-holders-and-reels",
            "name": "Badge Holders and Reels"
          },
          {
            "slug": "wristbands",
            "name": "Wristbands"
          },
          {
            "slug": "lanyards-and-wristbands-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "food-and-drinks",
        "name": "Food & Drinks",
        "children": [
          {
            "slug": "mints-and-candy",
            "name": "Mints & Candy"
          },
          {
            "slug": "chocolate-gift-box",
            "name": "Chocolate Gift Box"
          },
          {
            "slug": "cookies",
            "name": "Cookies"
          },
          {
            "slug": "popcorn",
            "name": "Popcorn"
          },
          {
            "slug": "drinks",
            "name": "Drinks"
          },
          {
            "slug": "food-and-drinks-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "display-items",
        "name": "Display Items",
        "children": [
          {
            "slug": "balloons",
            "name": "Balloons"
          },
          {
            "slug": "flags",
            "name": "Flags"
          },
          {
            "slug": "banners",
            "name": "Banners"
          },
          {
            "slug": "table-covers",
            "name": "Table Covers"
          },
          {
            "slug": "tents",
            "name": "Tents"
          },
          {
            "slug": "inflatables",
            "name": "Inflatables"
          },
          {
            "slug": "led-sign",
            "name": "LED Sign"
          },
          {
            "slug": "display-items-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "other",
        "name": "Other",
        "children": [
          {
            "slug": "custom-teddy-bears",
            "name": "Custom Teddy Bears"
          },
          {
            "slug": "magnets",
            "name": "Magnets"
          },
          {
            "slug": "badges-and-medallions",
            "name": "Badges & Medallions"
          },
          {
            "slug": "luggage-tags",
            "name": "Luggage Tags"
          },
          {
            "slug": "tattoos",
            "name": "Tattoos"
          },
          {
            "slug": "other-other",
            "name": "Other"
          }
        ]
      }
    ]
  },
  {
    "slug": "usb-and-tech",
    "name": "USB & Tech",
    "children": [
      {
        "slug": "usb",
        "name": "USB",
        "children": [
          {
            "slug": "metal",
            "name": "Metal"
          },
          {
            "slug": "pvc-plastic",
            "name": "PVC/Plastic"
          },
          {
            "slug": "wooden",
            "name": "Wooden"
          },
          {
            "slug": "usb-bracelets",
            "name": "USB Bracelets"
          },
          {
            "slug": "usb-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "phone-and-tablet",
        "name": "Phone & Tablet",
        "children": [
          {
            "slug": "power-banks",
            "name": "Power Banks"
          },
          {
            "slug": "stands-and-holders",
            "name": "Stands & Holders"
          },
          {
            "slug": "tablet-cases",
            "name": "Tablet Cases"
          },
          {
            "slug": "phone-cases",
            "name": "Phone Cases"
          },
          {
            "slug": "phone-and-tablet-accessories",
            "name": "Accessories"
          },
          {
            "slug": "wireless-chargers",
            "name": "Wireless Chargers"
          },
          {
            "slug": "phone-wallets",
            "name": "Phone Wallets"
          },
          {
            "slug": "charging-cables",
            "name": "Charging Cables"
          },
          {
            "slug": "stylus",
            "name": "Stylus"
          },
          {
            "slug": "phone-and-tablet-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "pc-accessories",
        "name": "PC Accessories",
        "children": [
          {
            "slug": "mouse-pads",
            "name": "Mouse Pads"
          },
          {
            "slug": "mice-and-keyboards",
            "name": "Mice & Keyboards"
          },
          {
            "slug": "usb-hubs",
            "name": "USB Hubs"
          },
          {
            "slug": "screen-cleaning-cloths",
            "name": "Screen Cleaning Cloths"
          },
          {
            "slug": "webcam-covers",
            "name": "Webcam Covers"
          },
          {
            "slug": "pc-accessories-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "electrical-items",
        "name": "Electrical Items",
        "children": [
          {
            "slug": "usb-fans-and-desk-fans",
            "name": "USB Fans & Desk Fans"
          },
          {
            "slug": "clocks",
            "name": "Clocks"
          },
          {
            "slug": "watches",
            "name": "Watches"
          },
          {
            "slug": "lighting",
            "name": "Lighting"
          },
          {
            "slug": "solar-products",
            "name": "Solar Products"
          },
          {
            "slug": "gadgets",
            "name": "Gadgets"
          },
          {
            "slug": "electrical-items-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "audio-products",
        "name": "Audio Products",
        "children": [
          {
            "slug": "speakers",
            "name": "Speakers"
          },
          {
            "slug": "headphones-and-earphones",
            "name": "Headphones & Earphones"
          },
          {
            "slug": "earbuds",
            "name": "Earbuds"
          },
          {
            "slug": "radios",
            "name": "Radios"
          },
          {
            "slug": "audio-products-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "usb-and-tech-other",
        "name": "Other",
        "children": [
          {
            "slug": "adapters",
            "name": "Adapters"
          },
          {
            "slug": "vr-glasses-and-headsets",
            "name": "VR Glasses & Headsets"
          },
          {
            "slug": "popsockets-r",
            "name": "PopSockets (R)"
          },
          {
            "slug": "laptop-desk-tray",
            "name": "Laptop Desk Tray"
          },
          {
            "slug": "tech-organizer",
            "name": "Tech Organizer"
          },
          {
            "slug": "charger-cables",
            "name": "Charger Cables"
          },
          {
            "slug": "selfie-sticks-and-lights",
            "name": "Selfie Sticks & Lights"
          },
          {
            "slug": "cable-ties",
            "name": "Cable Ties"
          },
          {
            "slug": "wipes",
            "name": "Wipes"
          },
          {
            "slug": "usb-and-tech-other-other",
            "name": "Other"
          }
        ]
      }
    ]
  },
  {
    "slug": "apparel",
    "name": "Apparel",
    "children": [
      {
        "slug": "clothing",
        "name": "Clothing",
        "children": [
          {
            "slug": "clothing-t-shirts",
            "name": "T-Shirts"
          },
          {
            "slug": "polo-shirts",
            "name": "Polo Shirts"
          },
          {
            "slug": "shirts",
            "name": "Shirts"
          },
          {
            "slug": "hoodies",
            "name": "Hoodies"
          },
          {
            "slug": "sweatshirts",
            "name": "Sweatshirts"
          },
          {
            "slug": "ponchos",
            "name": "Ponchos"
          },
          {
            "slug": "jackets",
            "name": "Jackets"
          },
          {
            "slug": "aprons",
            "name": "Aprons"
          },
          {
            "slug": "safety-wear",
            "name": "Safety Wear"
          },
          {
            "slug": "pants",
            "name": "Pants"
          },
          {
            "slug": "clothing-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "apparel-accessories",
        "name": "Accessories",
        "children": [
          {
            "slug": "custom-scarves",
            "name": "Custom Scarves"
          },
          {
            "slug": "custom-bandanas",
            "name": "Custom Bandanas"
          },
          {
            "slug": "caps-hats-and-beanies",
            "name": "Caps, Hats & Beanies"
          },
          {
            "slug": "sunglasses-and-accessories",
            "name": "Sunglasses & Accessories"
          },
          {
            "slug": "footwear",
            "name": "Footwear"
          },
          {
            "slug": "slippers",
            "name": "Slippers"
          },
          {
            "slug": "branded-socks",
            "name": "Branded Socks"
          },
          {
            "slug": "apparel-accessories-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "apparel-other",
        "name": "Other"
      }
    ]
  },
  {
    "slug": "office-and-desk",
    "name": "Office & Desk",
    "children": [
      {
        "slug": "desk-items",
        "name": "Desk Items",
        "children": [
          {
            "slug": "calendars",
            "name": "Calendars"
          },
          {
            "slug": "calculators",
            "name": "Calculators"
          },
          {
            "slug": "binders-clipboards",
            "name": "Binders/Clipboards"
          },
          {
            "slug": "folders-portfolios",
            "name": "Folders/Portfolios"
          },
          {
            "slug": "planners",
            "name": "Planners"
          },
          {
            "slug": "coasters",
            "name": "Coasters"
          },
          {
            "slug": "pen-holders-and-desk-caddys",
            "name": "Pen Holders & Desk Caddys"
          },
          {
            "slug": "paperweights",
            "name": "Paperweights"
          },
          {
            "slug": "business-card-holders",
            "name": "Business Card Holders"
          },
          {
            "slug": "desk-items-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "notebooks-journals-and-notepads",
        "name": "Notebooks, Journals & Notepads",
        "children": [
          {
            "slug": "notebooks",
            "name": "Notebooks"
          },
          {
            "slug": "journals-and-diaries",
            "name": "Journals & Diaries"
          },
          {
            "slug": "notepads",
            "name": "Notepads"
          },
          {
            "slug": "luxury-executive-notebooks",
            "name": "Luxury Executive Notebooks"
          },
          {
            "slug": "notebooks-journals-and-notepads-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "paper-products",
        "name": "Paper Products",
        "children": [
          {
            "slug": "sticky-notes",
            "name": "Sticky Notes"
          },
          {
            "slug": "memo-clips-and-memo-boards",
            "name": "Memo Clips & Memo Boards"
          },
          {
            "slug": "business-cards",
            "name": "Business Cards"
          },
          {
            "slug": "stickers",
            "name": "Stickers"
          },
          {
            "slug": "paper-clips",
            "name": "Paper Clips"
          },
          {
            "slug": "cards-envelopes-tags",
            "name": "Cards/Envelopes/Tags"
          },
          {
            "slug": "paper-products-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "stationery-products",
        "name": "Stationery Products",
        "children": [
          {
            "slug": "sharpeners",
            "name": "Sharpeners"
          },
          {
            "slug": "rulers",
            "name": "Rulers"
          },
          {
            "slug": "erasers",
            "name": "Erasers"
          },
          {
            "slug": "letter-openers",
            "name": "Letter Openers"
          },
          {
            "slug": "stationery-sets",
            "name": "Stationery Sets"
          },
          {
            "slug": "bookmarks",
            "name": "Bookmarks"
          },
          {
            "slug": "stationery-products-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "awards",
        "name": "Awards",
        "children": [
          {
            "slug": "crystal-awards-and-trophies",
            "name": "Crystal Awards and Trophies"
          },
          {
            "slug": "glass-awards",
            "name": "Glass Awards"
          },
          {
            "slug": "metal-awards",
            "name": "Metal Awards"
          },
          {
            "slug": "wood-awards",
            "name": "Wood Awards"
          },
          {
            "slug": "awards-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "office-and-desk-other",
        "name": "Other"
      }
    ]
  },
  {
    "slug": "leisure",
    "name": "Leisure",
    "children": [
      {
        "slug": "sports-products",
        "name": "Sports Products",
        "children": [
          {
            "slug": "basketball",
            "name": "Basketball"
          },
          {
            "slug": "football",
            "name": "Football"
          },
          {
            "slug": "baseball",
            "name": "Baseball"
          },
          {
            "slug": "hockey",
            "name": "Hockey"
          },
          {
            "slug": "soccer",
            "name": "Soccer"
          },
          {
            "slug": "noise-makers",
            "name": "Noise Makers"
          },
          {
            "slug": "sports-products-other",
            "name": "Other"
          },
          {
            "slug": "seat-cushions",
            "name": "Seat Cushions"
          }
        ]
      },
      {
        "slug": "umbrellas",
        "name": "Umbrellas",
        "children": [
          {
            "slug": "umbrellas-best-sellers",
            "name": "Best Sellers"
          },
          {
            "slug": "budget-friendly",
            "name": "Budget-Friendly"
          },
          {
            "slug": "telescopic",
            "name": "Telescopic"
          },
          {
            "slug": "golf",
            "name": "Golf"
          },
          {
            "slug": "parasols",
            "name": "Parasols"
          },
          {
            "slug": "umbrellas-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "golf-products",
        "name": "Golf Products",
        "children": [
          {
            "slug": "custom-golf-balls",
            "name": "Custom Golf Balls"
          },
          {
            "slug": "tees-and-markers",
            "name": "Tees and Markers"
          },
          {
            "slug": "printed-golf-balls",
            "name": "Printed Golf Balls"
          },
          {
            "slug": "golf-gift-sets",
            "name": "Golf Gift Sets"
          },
          {
            "slug": "golf-products-accessories",
            "name": "Accessories"
          },
          {
            "slug": "golf-apparel",
            "name": "Golf Apparel"
          },
          {
            "slug": "golf-products-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "homeware",
        "name": "Homeware",
        "children": [
          {
            "slug": "living-home",
            "name": "Living/Home"
          },
          {
            "slug": "kitchenware",
            "name": "Kitchenware"
          },
          {
            "slug": "bathroom",
            "name": "Bathroom"
          },
          {
            "slug": "garden",
            "name": "Garden"
          },
          {
            "slug": "beauty-and-health",
            "name": "Beauty & Health"
          },
          {
            "slug": "homeware-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "outdoor-products",
        "name": "Outdoor Products",
        "children": [
          {
            "slug": "chairs",
            "name": "Chairs"
          },
          {
            "slug": "leisure-and-fun",
            "name": "Leisure and Fun"
          },
          {
            "slug": "cycling",
            "name": "Cycling"
          },
          {
            "slug": "camping-picnic",
            "name": "Camping Picnic"
          },
          {
            "slug": "beach",
            "name": "Beach"
          },
          {
            "slug": "outdoor-products-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "automotive",
        "name": "Automotive",
        "children": [
          {
            "slug": "sun-shades",
            "name": "Sun Shades"
          },
          {
            "slug": "ice-scrapers",
            "name": "Ice Scrapers"
          },
          {
            "slug": "air-fresheners",
            "name": "Air Fresheners"
          },
          {
            "slug": "car-accessories",
            "name": "Car Accessories"
          },
          {
            "slug": "car-chargers",
            "name": "Car Chargers"
          },
          {
            "slug": "automotive-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "practical-items",
        "name": "Practical Items",
        "children": [
          {
            "slug": "tape-measures",
            "name": "Tape Measures"
          },
          {
            "slug": "flashlights",
            "name": "Flashlights"
          },
          {
            "slug": "lighters-and-ashtrays",
            "name": "Lighters & Ashtrays"
          },
          {
            "slug": "bottle-openers",
            "name": "Bottle Openers"
          },
          {
            "slug": "tools",
            "name": "Tools"
          },
          {
            "slug": "cigar-accessories",
            "name": "Cigar Accessories"
          },
          {
            "slug": "practical-items-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "leisure-other",
        "name": "Other"
      }
    ]
  },
  {
    "slug": "keychains",
    "name": "Keychains",
    "children": [
      {
        "slug": "practical-keychains",
        "name": "Practical Keychains",
        "children": [
          {
            "slug": "bottle-opener-keychains",
            "name": "Bottle Opener Keychains"
          },
          {
            "slug": "led-torch-and-tools-keychains",
            "name": "LED Torch & Tools Keychains"
          },
          {
            "slug": "practical-keychains-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "promotional-plastic-keychains",
        "name": "Promotional Plastic Keychains",
        "children": [
          {
            "slug": "plastic-keychains",
            "name": "Plastic Keychains"
          },
          {
            "slug": "novelty-keychains",
            "name": "Novelty Keychains"
          },
          {
            "slug": "promotional-plastic-keychains-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "keychains-other",
        "name": "Other",
        "children": [
          {
            "slug": "leather-keychains",
            "name": "Leather Keychains"
          },
          {
            "slug": "wooden-keychains",
            "name": "Wooden Keychains"
          },
          {
            "slug": "metal-keychains",
            "name": "Metal Keychains"
          },
          {
            "slug": "embroidered-keychains",
            "name": "Embroidered Keychains"
          },
          {
            "slug": "keychains-other-other",
            "name": "Other"
          }
        ]
      }
    ]
  },
  {
    "slug": "themes",
    "name": "Themes",
    "children": [
      {
        "slug": "seasonal-products",
        "name": "Seasonal Products",
        "children": [
          {
            "slug": "4th-july",
            "name": "4th July"
          },
          {
            "slug": "festival",
            "name": "Festival"
          },
          {
            "slug": "halloween",
            "name": "Halloween"
          },
          {
            "slug": "christmas",
            "name": "Christmas"
          },
          {
            "slug": "valentine-s-day",
            "name": "Valentine's Day"
          },
          {
            "slug": "st-patrick-s-day",
            "name": "St Patrick's Day"
          },
          {
            "slug": "easter",
            "name": "Easter"
          },
          {
            "slug": "holiday-ornaments",
            "name": "Holiday Ornaments"
          },
          {
            "slug": "seasonal-products-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "themes-other",
        "name": "Other"
      }
    ]
  },
  {
    "slug": "bags-and-totes",
    "name": "Bags & Totes",
    "children": [
      {
        "slug": "shopping-bags",
        "name": "Shopping Bags",
        "children": [
          {
            "slug": "cotton-bags",
            "name": "Cotton Bags"
          },
          {
            "slug": "canvas-bags",
            "name": "Canvas Bags"
          },
          {
            "slug": "jute-bags",
            "name": "Jute Bags"
          },
          {
            "slug": "non-woven-bags",
            "name": "Non-Woven Bags"
          },
          {
            "slug": "paper-bags",
            "name": "Paper Bags"
          },
          {
            "slug": "foldable-tote-bags",
            "name": "Foldable Tote Bags"
          },
          {
            "slug": "plastic-bags",
            "name": "Plastic Bags"
          },
          {
            "slug": "shopping-bags-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "leisure-and-sports-bags",
        "name": "Leisure & Sports Bags",
        "children": [
          {
            "slug": "cooler-bags",
            "name": "Cooler Bags"
          },
          {
            "slug": "stadium-bags",
            "name": "Stadium Bags"
          },
          {
            "slug": "waist-bags",
            "name": "Waist Bags"
          },
          {
            "slug": "shoe-bags",
            "name": "Shoe Bags"
          },
          {
            "slug": "trolley-bags",
            "name": "Trolley Bags"
          },
          {
            "slug": "toiletry-bags",
            "name": "Toiletry Bags"
          },
          {
            "slug": "leisure-and-sports-bags-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "bags-and-backpacks",
        "name": "Bags & Backpacks",
        "children": [
          {
            "slug": "backpacks",
            "name": "Backpacks"
          },
          {
            "slug": "rucksacks",
            "name": "Rucksacks"
          },
          {
            "slug": "duffel-bags",
            "name": "Duffel Bags"
          },
          {
            "slug": "drawstring-bags",
            "name": "Drawstring Bags"
          },
          {
            "slug": "bags-and-backpacks-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "business-bags",
        "name": "Business Bags",
        "children": [
          {
            "slug": "messenger-bag",
            "name": "Messenger Bag"
          },
          {
            "slug": "laptop-and-tablet-bags-and-sleeves",
            "name": "Laptop & Tablet Bags & Sleeves"
          },
          {
            "slug": "document-and-conference-bags",
            "name": "Document & Conference Bags"
          },
          {
            "slug": "travel-bags",
            "name": "Travel Bags"
          },
          {
            "slug": "wallets-and-purses",
            "name": "Wallets & Purses"
          },
          {
            "slug": "business-bags-luggage-tags",
            "name": "Luggage Tags"
          },
          {
            "slug": "business-bags-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "bags-and-totes-other",
        "name": "Other"
      }
    ]
  },
  {
    "slug": "eco-friendly",
    "name": "Eco-Friendly",
    "children": [
      {
        "slug": "eco-products",
        "name": "Eco Products",
        "children": [
          {
            "slug": "bamboo",
            "name": "Bamboo"
          },
          {
            "slug": "tech",
            "name": "Tech"
          },
          {
            "slug": "reusable-straws",
            "name": "Reusable Straws"
          },
          {
            "slug": "eco-products-drinkware",
            "name": "Drinkware"
          },
          {
            "slug": "eco-products-pencils",
            "name": "Pencils"
          },
          {
            "slug": "eco-products-pens",
            "name": "Pens"
          },
          {
            "slug": "bags",
            "name": "Bags"
          },
          {
            "slug": "eco-products-notebooks",
            "name": "Notebooks"
          },
          {
            "slug": "eco-products-homeware",
            "name": "Homeware"
          },
          {
            "slug": "eco-products-clothing",
            "name": "Clothing"
          },
          {
            "slug": "plants-and-seeds",
            "name": "Plants & Seeds"
          },
          {
            "slug": "paper",
            "name": "Paper"
          },
          {
            "slug": "eco-products-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "eco-friendly-other",
        "name": "Other"
      }
    ]
  },
  {
    "slug": "healthcare",
    "name": "Healthcare",
    "children": [
      {
        "slug": "infection-control-and-ppe",
        "name": "Infection Control & PPE"
      },
      {
        "slug": "first-aid-and-emergency-preparedness",
        "name": "First Aid & Emergency Preparedness"
      },
      {
        "slug": "patient-care-and-monitoring",
        "name": "Patient Care & Monitoring"
      },
      {
        "slug": "medication-adherence-tools",
        "name": "Medication Adherence Tools"
      },
      {
        "slug": "staff-id-and-workplace-essentials",
        "name": "Staff ID & Workplace Essentials"
      },
      {
        "slug": "patient-comfort-and-care-kits",
        "name": "Patient Comfort & Care Kits"
      },
      {
        "slug": "healthcare-other",
        "name": "Other"
      }
    ]
  },
  {
    "slug": "express-service",
    "name": "Express Service",
    "children": [
      {
        "slug": "express",
        "name": "Express",
        "children": [
          {
            "slug": "next-day-dispatch",
            "name": "Next Day Dispatch"
          },
          {
            "slug": "express-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "express-service-other",
        "name": "Other"
      }
    ]
  },
  {
    "slug": "more",
    "name": "More",
    "children": [
      {
        "slug": "health-and-beauty",
        "name": "Health & Beauty",
        "children": [
          {
            "slug": "soap",
            "name": "Soap"
          },
          {
            "slug": "mirrors",
            "name": "Mirrors"
          },
          {
            "slug": "lip-balms",
            "name": "Lip Balms"
          },
          {
            "slug": "first-aid-kits",
            "name": "First Aid Kits"
          },
          {
            "slug": "health-and-beauty-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "shoe-accessories",
        "name": "Shoe Accessories",
        "children": [
          {
            "slug": "custom-shoe-horns",
            "name": "Custom Shoe Horns"
          },
          {
            "slug": "shoe-covers",
            "name": "Shoe Covers"
          },
          {
            "slug": "shoe-shine-kits",
            "name": "Shoe Shine Kits"
          },
          {
            "slug": "shoe-accessories-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "fitness-products",
        "name": "Fitness Products",
        "children": [
          {
            "slug": "yoga",
            "name": "Yoga"
          },
          {
            "slug": "fitness-accessories",
            "name": "Fitness Accessories"
          },
          {
            "slug": "cooling-towels",
            "name": "Cooling Towels"
          },
          {
            "slug": "fitness-products-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "pet-care",
        "name": "Pet Care",
        "children": [
          {
            "slug": "collars-and-leashes",
            "name": "Collars & Leashes"
          },
          {
            "slug": "pet-bowls",
            "name": "Pet Bowls"
          },
          {
            "slug": "pet-care-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "children",
        "name": "Children",
        "children": [
          {
            "slug": "piggy-banks",
            "name": "Piggy Banks"
          },
          {
            "slug": "coloring-books",
            "name": "Coloring Books"
          },
          {
            "slug": "children-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "lifestyle-and-home",
        "name": "Lifestyle & Home",
        "children": [
          {
            "slug": "blankets",
            "name": "Blankets"
          },
          {
            "slug": "playing-cards",
            "name": "Playing Cards"
          },
          {
            "slug": "lanterns",
            "name": "Lanterns"
          },
          {
            "slug": "lifestyle-and-home-inflatables",
            "name": "Inflatables"
          },
          {
            "slug": "desk-organizers",
            "name": "Desk Organizers"
          },
          {
            "slug": "lifestyle-and-home-other",
            "name": "Other"
          }
        ]
      },
      {
        "slug": "more-other",
        "name": "Other"
      }
    ]
  }
];

export const asiMap: SourceMap = {
  "3-d Products": "lifestyle-and-home-other",
  "3d & Virtual Reality Viewers": "vr-glasses-and-headsets",
  "Address Books": "notebooks-journals-and-notepads-other",
  "Adult Novelties": "novelty-and-foam-other",
  "Alarms & Protective Devices": "gadgets",
  "Albums": "desk-organizers",
  "Almanacs": "calendars",
  "Antenna Accessories": "car-accessories",
  "Antibacterial Products": "infection-control-and-ppe",
  "Antimicrobial Enhanced Products": "infection-control-and-ppe",
  "Apothecary Jars": "mason-jars",
  "Aprons": "aprons",
  "Arm Bands": "apparel-accessories-other",
  "Art & Design Services": "office-and-desk-other",
  "Art Supplies": "stationery-products-other",
  "Auto Accessories": "car-accessories",
  "Auto Dealer Aids": "car-accessories",
  "Auto Visor Accessories": "car-accessories",
  "Award Ribbons": "badges-and-medallions",
  "Awards": "awards-other",
  "Awards > Clocks": "clocks",
  "Awards > Crystal": "crystal-awards-and-trophies",
  "Awards > Glass": "glass-awards",
  "Awards > Sculptures & Figurines": "crystal-awards-and-trophies",
  "Baby Items": "children-other",
  "Back Scratchers": "health-and-beauty-other",
  "Backpacks": "backpacks",
  "Backpacks > Drawstring": "drawstring-bags",
  "Backpacks > Laptop": "laptop-and-tablet-bags-and-sleeves",
  "Badge & Button Accessories/findings": "badge-holders-and-reels",
  "Badge Holders": "badge-holders-and-reels",
  "Badges & Name Tags": "badges-and-medallions",
  "Bag Clips & Sealers": "kitchenware",
  "Bags": "bags-and-totes-other",
  "Bags > Bottle": "leisure-and-sports-bags-other",
  "Bags > Crossbody And Sling": "messenger-bag",
  "Bags > Drawstring": "drawstring-bags",
  "Bags > Fanny/hip/waist": "waist-bags",
  "Bags > Food": "cooler-bags",
  "Bags > Leather": "business-bags-other",
  "Bags > Lunch": "cooler-bags",
  "Bags > Shoe": "shoe-bags",
  "Bags > Shopping": "shopping-bags-other",
  "Balloon Accessories": "balloons",
  "Balloons": "balloons",
  "Balls": "sports-products-other",
  "Bandages": "first-aid-and-emergency-preparedness",
  "Bandannas": "custom-bandanas",
  "Banks": "piggy-banks",
  "Banners": "banners",
  "Bar Accessories": "bar-accessories",
  "Barbecue Accessories": "garden",
  "Barometers & Hygrometers": "gadgets",
  "Bars": "bar-accessories",
  "Baseball Caps": "caps-hats-and-beanies",
  "Baseballs": "baseball",
  "Basketballs": "basketball",
  "Baskets": "living-home",
  "Bathroom Accessories": "bathroom",
  "Batteries": "gadgets",
  "Battery Rechargers & Adaptors": "power-banks",
  "Beach Balls": "beach",
  "Beauty Aids": "health-and-beauty-other",
  "Bedroom Accessories": "living-home",
  "Bells": "noise-makers",
  "Belt Buckles": "apparel-accessories-other",
  "Belts": "apparel-accessories-other",
  "Beverage Holders": "can-coolers-and-koozies",
  "Beverages": "drinks",
  "Bibs": "children-other",
  "Bicycle Accessories": "cycling",
  "Binders": "binders-clipboards",
  "Binoculars & Spotting Scopes": "leisure-and-fun",
  "Blackboards": "office-and-desk-other",
  "Blankets": "blankets",
  "Bluetooth Trackers & Gps Device Accessories": "gadgets",
  "Bluetooth Trackers & Gps Devices": "gadgets",
  "Boards": "memo-clips-and-memo-boards",
  "Book Covers": "paper-products-other",
  "Book Ends & Racks": "desk-items-other",
  "Book Lights": "lighting",
  "Bookmarks": "bookmarks",
  "Books": "lifestyle-and-home-other",
  "Boomerangs": "leisure-and-fun",
  "Boots": "footwear",
  "Bottles": "water-bottles-other",
  "Bottles > Insulated": "vacuum-flasks-and-bottles",
  "Bottles > Sport Type": "sports-bottles",
  "Bowls": "kitchenware",
  "Boxes": "office-and-desk-other",
  "Boxes & Cases-pen & Pencil": "pen-display-boxes",
  "Boxes > Ballot/contest/suggestion": "display-items-other",
  "Boxes > General": "office-and-desk-other",
  "Boxes > Presentation": "office-and-desk-other",
  "Boxes > Security": "office-and-desk-other",
  "Boxes > Takeout/delivery": "kitchenware",
  "Boxes > Tooth": "children-other",
  "Bracelets": "wristbands",
  "Briefcases": "document-and-conference-bags",
  "Brochure & Literature Holders": "display-items-other",
  "Brooms-mops & Vacuums": "living-home",
  "Brushes": "health-and-beauty-other",
  "Buckets": "kitchenware",
  "Bulletin Boards": "memo-clips-and-memo-boards",
  "Bumper Stickers": "stickers",
  "Business Card Holders": "business-card-holders",
  "Business Cards": "business-cards",
  "Business Forms": "paper-products-other",
  "Butter Dishes": "kitchenware",
  "Buttons": "badges-and-medallions",
  "Cabinets": "living-home",
  "Calculators": "calculators",
  "Calendar Pads": "calendars",
  "Calendars": "calendars",
  "Calipers": "tools",
  "Camera Cases": "gadgets",
  "Cameras": "gadgets",
  "Camping Equipment": "camping-picnic",
  "Candle Holders": "living-home",
  "Candle Snuffers": "living-home",
  "Candles & Incense & Potpourri": "living-home",
  "Candy": "mints-and-candy",
  "Candy Dishes": "mints-and-candy",
  "Canes": "patient-care-and-monitoring",
  "Canisters": "kitchenware",
  "Canopies & Awnings": "tents",
  "Canteens": "water-bottles-other",
  "Cap & Hat Accessories": "caps-hats-and-beanies",
  "Caps & Hats": "caps-hats-and-beanies",
  "Car Sun Shades": "sun-shades",
  "Carabiners": "practical-keychains-other",
  "Carafes & Carafe Sets": "bar-glassware-other",
  "Card Sleeves": "business-card-holders",
  "Cards": "cards-envelopes-tags",
  "Carriers": "bags-and-totes-other",
  "Carton Cutters": "tools",
  "Carts": "living-home",
  "Cases & Holders": "desk-items-other",
  "Cassette Recorders & Players": "audio-products-other",
  "Cds/dvds/players": "gadgets",
  "Certificate Holders & Frames": "awards-other",
  "Certificates": "paper-products-other",
  "Chalk": "stationery-products-other",
  "Charms": "keychains-other-other",
  "Charts": "paper-products-other",
  "Check & Bank Book Covers": "wallets-and-purses",
  "Checks": "paper-products-other",
  "Cheering Accessories": "noise-makers",
  "Chimes": "living-home",
  "Chopsticks": "kitchenware",
  "Cleaners": "living-home",
  "Clipboards": "binders-clipboards",
  "Clips-utility": "paper-clips",
  "Clocks": "clocks",
  "Clothing": "clothing-other",
  "Coasters & Coaster Sets": "coasters",
  "Coffee Pots": "kitchenware",
  "Coin Holders": "wallets-and-purses",
  "Coin Purses": "wallets-and-purses",
  "Coins-tokens & Medallions": "badges-and-medallions",
  "Coloring & Activity Books": "coloring-books",
  "Coloring Sets": "coloring-books",
  "Combs": "health-and-beauty-other",
  "Compacts & Pocket Mirrors": "mirrors",
  "Compasses": "camping-picnic",
  "Computer Accessories": "pc-accessories-other",
  "Containers": "kitchenware",
  "Cookbooks": "kitchenware",
  "Cookware & Bakeware": "kitchenware",
  "Coolers": "cooler-bags",
  "Cooling Towels & Scarves": "cooling-towels",
  "Corkscrews": "wine-products",
  "Cosmetic Bags": "toiletry-bags",
  "Costumes & Accessories": "capes",
  "Counting Devices": "gadgets",
  "Coupon Keepers": "wallets-and-purses",
  "Covers": "office-and-desk-other",
  "Covers > Furniture": "living-home",
  "Covers > General": "office-and-desk-other",
  "Covers > Guest Check": "office-and-desk-other",
  "Covers > Skins": "phone-cases",
  "Covers > Steering Wheel": "car-accessories",
  "Covers > Webcam": "webcam-covers",
  "Cowboy Hats": "caps-hats-and-beanies",
  "Crayons": "colouring-crayons",
  "Crosses": "novelty-and-foam-other",
  "Crystal Balls": "crystal-awards-and-trophies",
  "Crystal Products": "crystal-awards-and-trophies",
  "Cups": "tumblers-and-cups-other",
  "Curtains & Draperies & Shades": "living-home",
  "Custom Products": "more-other",
  "Custom Products > Custom Lapel Pins": "badges-and-medallions",
  "Custom Products > General": "more-other",
  "Cutters": "tools",
  "Decals": "stickers",
  "Decanter Sets": "bar-glassware-other",
  "Decanters": "bar-glassware-other",
  "Decorations": "seasonal-products-other",
  "Decorators": "novelty-and-foam-other",
  "Dental Floss": "health-and-beauty-other",
  "Deodorizers": "air-fresheners",
  "Deposit Bags": "document-and-conference-bags",
  "Desk Accessories": "desk-items-other",
  "Desk Pen Stands": "pen-holders-and-desk-caddys",
  "Dials & Slide Charts": "paper-products-other",
  "Dice Specialties": "games-and-puzzles",
  "Dishes & Dish Sets": "kitchenware",
  "Dispensers": "bathroom",
  "Display Cases": "display-items-other",
  "Dolls": "custom-teddy-bears",
  "Doorstops": "living-home",
  "Drink Mixers & Shakers": "bar-accessories",
  "Drones": "gadgets",
  "Duffel Bags": "duffel-bags",
  "Dustpans": "living-home",
  "Earmuffs": "caps-hats-and-beanies",
  "Earplugs": "infection-control-and-ppe",
  "Easels": "display-items-other",
  "Education Programs": "paper-products-other",
  "Eggs-plastic": "easter",
  "Electric Outlet Protectors": "living-home",
  "Electronic Devices": "gadgets",
  "Emblems": "badges-and-medallions",
  "Envelopes": "cards-envelopes-tags",
  "Equipment": "office-and-desk-other",
  "Equipment > Bindery": "office-and-desk-other",
  "Equipment > Embroidery": "office-and-desk-other",
  "Equipment > General": "office-and-desk-other",
  "Equipment > Laminating": "office-and-desk-other",
  "Equipment > Prepress": "office-and-desk-other",
  "Erasers": "erasers",
  "Exercise Clothes": "clothing-other",
  "Exercise Equipment": "fitness-accessories",
  "Extension Cords": "adapters",
  "Eyeglass Accessories": "sunglasses-and-accessories",
  "Eyeglass Cases & Holders": "sunglasses-and-accessories",
  "Eyeglass Cleaners": "sunglasses-and-accessories",
  "Eyeglasses": "sunglasses-and-accessories",
  "Fans": "hand-fans",
  "Fasteners": "paper-clips",
  "Figurines": "lifestyle-and-home-other",
  "Fire Extinguishers": "first-aid-and-emergency-preparedness",
  "Fire Pits": "garden",
  "Fireplace & Fireplace Accessories": "living-home",
  "Flag Accessories": "flags",
  "Flags": "flags",
  "Flashlights": "flashlights",
  "Flasks": "hip-flasks",
  "Flatware": "kitchenware",
  "Flip Flops": "footwear",
  "Flying Saucers & Discs": "sports-products-other",
  "Flyswatters": "garden",
  "Foam Novelties": "foam-products",
  "Folders": "folders-portfolios",
  "Folding Seats": "chairs",
  "Food Gifts": "food-and-drinks-other",
  "Footballs": "football",
  "Forks & Spoons": "kitchenware",
  "Frames": "living-home",
  "Fresheners": "air-fresheners",
  "Funnels": "kitchenware",
  "Furniture": "chairs",
  "Game Parts": "games-and-puzzles",
  "Games": "games-and-puzzles",
  "Garment Bags": "travel-bags",
  "Garters/leg Bands": "apparel-accessories-other",
  "Gauges": "car-accessories",
  "Gavels": "awards-other",
  "Gift Sets": "more-other",
  "Gift Wrap": "paper-products-other",
  "Glasses-drinking": "bar-glassware-other",
  "Glasses-drinking > Beer Jars": "beer-glasses",
  "Glasses-drinking > Insulated": "tumblers",
  "Glasses-drinking > Pilsner": "pint-and-stein-glasses",
  "Glasses-drinking > Tumbler": "tumblers",
  "Glasses-drinking > With Lid & Straw": "tumblers",
  "Globes": "lifestyle-and-home-other",
  "Gloves": "infection-control-and-ppe",
  "Glow Products": "light-up",
  "Glue": "stationery-products-other",
  "Goggles": "sunglasses-and-accessories",
  "Golf Accessories": "golf-products-accessories",
  "Golf Bags": "golf-products-accessories",
  "Golf Balls": "printed-golf-balls",
  "Golf Clubs": "golf-products-accessories",
  "Golf Putters": "golf-products-accessories",
  "Golf Tees": "tees-and-markers",
  "Golf/polo Shirts": "polo-shirts",
  "Greeting Cards": "cards-envelopes-tags",
  "Grills": "garden",
  "Grippers": "popsockets-r",
  "Gun & Gun Accessories": "leisure-and-fun",
  "Hacky Sacks": "sports-products-other",
  "Hair Brushes": "health-and-beauty-other",
  "Hammocks": "leisure-and-fun",
  "Handbag Holders": "bags-and-totes-other",
  "Handkerchiefs": "apparel-accessories-other",
  "Handles": "lifestyle-and-home-other",
  "Hangers": "living-home",
  "Headbands": "apparel-accessories-other",
  "Headphones": "headphones-and-earphones",
  "Heat Transfers": "stationery-products-other",
  "Heaters": "living-home",
  "Heating Pads": "patient-comfort-and-care-kits",
  "Highlighters": "highlighter-and-marker-pens",
  "Holsters": "apparel-accessories-other",
  "Hooks": "lifestyle-and-home-other",
  "Horns": "noise-makers",
  "Hoses": "garden",
  "Humidifiers & Dehumidifiers": "living-home",
  "Hydration Bags": "leisure-and-sports-bags-other",
  "Ice Buckets": "bar-accessories",
  "Ice Cube Trays": "ice-cubes",
  "Ice Cubes": "ice-cubes",
  "Ice Packs": "first-aid-and-emergency-preparedness",
  "Ice Scrapers": "ice-scrapers",
  "Identity Protection Products": "wallets-and-purses",
  "Inflatable Accessories": "inflatables",
  "Inflatables": "inflatables",
  "Inflators": "cycling",
  "Ink": "stationery-products-other",
  "Insect Repellents & Exterminators": "camping-picnic",
  "Invitations": "cards-envelopes-tags",
  "Jackets": "jackets",
  "Jars": "mason-jars",
  "Jewelry": "lifestyle-and-home-other",
  "Jewelry Boxes & Rolls": "lifestyle-and-home-other",
  "Journals & Diaries": "journals-and-diaries",
  "Jugs": "water-bottles-other",
  "Kaleidoscopes": "games-and-puzzles",
  "Key Cases": "keychains-other-other",
  "Key Chains": "keychains-other-other",
  "Key Chains > Floating": "novelty-keychains",
  "Key Chains > Leather": "leather-keychains",
  "Key Chains > Metal": "metal-keychains",
  "Key Chains > Plastic": "plastic-keychains",
  "Key Chains > With Bottle Or Can Opener": "bottle-opener-keychains",
  "Key Chains > With Carabiner": "practical-keychains-other",
  "Key Chains > With Flashlight And/or Whistle": "led-torch-and-tools-keychains",
  "Key Chains > With Tools": "led-torch-and-tools-keychains",
  "Keys": "keychains-other-other",
  "Kites": "leisure-and-fun",
  "Kits": "more-other",
  "Kits > Auto": "car-accessories",
  "Kits > Desk Accessories": "desk-items-other",
  "Kits > Emergency Preparedness": "first-aid-and-emergency-preparedness",
  "Kits > First Aid": "first-aid-and-emergency-preparedness",
  "Kits > General": "more-other",
  "Kits > Grooming": "health-and-beauty-other",
  "Kits > Hobby": "lifestyle-and-home-other",
  "Kits > Identification": "badge-holders-and-reels",
  "Kits > Lunch": "cooler-bags",
  "Kits > Ppe": "infection-control-and-ppe",
  "Kits > Repair": "tools",
  "Kits > Travel": "travel-bags",
  "Knives": "tools",
  "Labels": "stickers",
  "Ladders": "tools",
  "Lamps": "lighting",
  "Lanterns": "lanterns",
  "Lanyards": "lanyards",
  "Lapel Pins": "badges-and-medallions",
  "Laptop Sleeves/cases": "laptop-and-tablet-bags-and-sleeves",
  "Laundry Aids": "living-home",
  "Lawn & Garden Accessories": "garden",
  "Led Products": "light-up",
  "Leis": "novelty-and-foam-other",
  "Letter Openers": "letter-openers",
  "Letterhead & Stationery": "stationery-products-other",
  "Letters & Numerals & Symbols": "display-items-other",
  "License Holders": "car-accessories",
  "License Plate Holders": "car-accessories",
  "License Plates": "car-accessories",
  "Lids & Caps": "accessories-other",
  "Life Preservers & Vests": "safety-wear",
  "Light Bulbs": "lighting",
  "Light Up Novelties": "light-up",
  "Lighters": "lighters-and-ashtrays",
  "Lights": "lighting",
  "Lint Removers": "living-home",
  "Lip Balm": "lip-balms",
  "Lipsticks & Lipstick Cases": "lip-balms",
  "Liquid Motion Products": "novelty-and-foam-other",
  "Locks": "travel-bags",
  "Loving Cup & Trophy Accessories": "awards-other",
  "Luggage": "travel-bags",
  "Luggage Sets": "travel-bags",
  "Luggage Tags": "business-bags-luggage-tags",
  "Magnets": "magnets",
  "Magnifiers": "tools",
  "Make-up/cosmetics": "health-and-beauty-other",
  "Mardi Gras Beads": "novelty-and-foam-other",
  "Markers": "highlighter-and-marker-pens",
  "Masks": "infection-control-and-ppe",
  "Massagers": "health-and-beauty-other",
  "Match-folder Specialties": "lighters-and-ashtrays",
  "Matches": "lighters-and-ashtrays",
  "Mats": "living-home",
  "Measuring Cups & Spoons": "kitchenware",
  "Measuring Devices": "tape-measures",
  "Medals": "badges-and-medallions",
  "Medical Information Cards": "first-aid-and-emergency-preparedness",
  "Medical Supplies": "patient-care-and-monitoring",
  "Megaphones": "noise-makers",
  "Memo Holders": "memo-clips-and-memo-boards",
  "Memo Pad & Paper Holders": "memo-clips-and-memo-boards",
  "Memo Pads": "notepads",
  "Menus & Menu Covers": "office-and-desk-other",
  "Messenger Bags": "messenger-bag",
  "Microfiber Cloths": "screen-cleaning-cloths",
  "Miniatures & Replicas": "lifestyle-and-home-other",
  "Mirrors": "mirrors",
  "Mobile Accessories": "phone-and-tablet-accessories",
  "Mobile Accessories > Cables & Cords": "charging-cables",
  "Mobile Accessories > Cell Phone Cases": "phone-cases",
  "Mobile Accessories > Cell Phone Wallets": "phone-wallets",
  "Mobile Accessories > Selfie Lights": "selfie-sticks-and-lights",
  "Mobile Accessories > Selfie Sticks": "selfie-sticks-and-lights",
  "Mobile Accessories > Stands & Holders": "stands-and-holders",
  "Mobile Apps": "office-and-desk-other",
  "Money": "novelty-and-foam-other",
  "Money Clips": "wallets-and-purses",
  "Mouse Pads": "mouse-pads",
  "Movie/clapboard Specialties": "lifestyle-and-home-other",
  "Mp3/mp4 Players": "audio-products-other",
  "Mugs & Steins": "mugs-other",
  "Mugs & Steins > Ceramic": "ceramic-mugs",
  "Mugs & Steins > Insulated": "travel-mugs",
  "Mugs & Steins > Metal": "metal-mugs",
  "Mugs & Steins > Porcelain": "ceramic-mugs",
  "Music Boxes": "novelty-and-foam-other",
  "Musical Instruments & Accessories": "lifestyle-and-home-other",
  "Nameplates": "awards-other",
  "Napkin Rings & Holders": "kitchenware",
  "Napkins": "kitchenware",
  "Neck Ties": "apparel-accessories-other",
  "Necklaces": "lifestyle-and-home-other",
  "Nets": "sports-products-other",
  "Noisemakers": "noise-makers",
  "Notebooks": "notebooks",
  "Office Equipment": "office-and-desk-other",
  "Office Supplies": "office-and-desk-other",
  "Openers": "bottle-openers",
  "Organizers": "desk-organizers",
  "Ornaments": "holiday-ornaments",
  "Outerwear-rainwear": "jackets",
  "Packaging Boxes": "office-and-desk-other",
  "Packaging Boxes > Corrugated": "office-and-desk-other",
  "Packaging Boxes > Custom": "office-and-desk-other",
  "Packaging Boxes > Mailers": "office-and-desk-other",
  "Packaging Boxes > Retail": "office-and-desk-other",
  "Packaging Boxes > Wine": "wine-products",
  "Pad Folios": "folders-portfolios",
  "Pads": "notepads",
  "Page Protectors": "paper-products-other",
  "Paint": "stationery-products-other",
  "Palms/pda Accessories": "phone-and-tablet-accessories",
  "Pamphlets/brochures/catalogs": "paper-products-other",
  "Paper": "paper-products-other",
  "Paper Specialties": "paper-products-other",
  "Paperweights": "paperweights",
  "Parking Permits": "car-accessories",
  "Party Favors": "novelty-and-foam-other",
  "Patches": "apparel-accessories-other",
  "Pedometers": "fitness-accessories",
  "Pen & Pencil Accessories": "pens-other",
  "Pen & Pencil Holders": "pen-holders-and-desk-caddys",
  "Pen & Pencil Sets": "pen-gift-sets",
  "Pencil Tops": "pencils-other",
  "Pencils": "pencils-other",
  "Pennants": "flags",
  "Pens": "pens-other",
  "Pens > Ballpoint-lacquered Finish": "metal-pens-ballpoint-pens",
  "Pens > Ballpoint-roller Ball": "rollerball-pens",
  "Pens > Ballpoint-stylus": "stylus-pens",
  "Pens > Ballpoint-with Highlighter": "highlighter-and-marker-pens",
  "Pens > Ballpoint-with Light": "led-pens",
  "Pens > Fountain": "fountain-pens",
  "Performance Apparel": "clothing-other",
  "Perfumes & Colognes": "health-and-beauty-other",
  "Pet Items": "pet-care-other",
  "Phones": "phone-and-tablet-other",
  "Photo Albums & Organizers": "desk-organizers",
  "Photo Cubes": "living-home",
  "Photography/darkroom Accessories": "gadgets",
  "Physical & Therapeutic Aids": "patient-comfort-and-care-kits",
  "Picnic Baskets & Kits": "camping-picnic",
  "Picture Frames": "living-home",
  "Pictures & Paintings": "living-home",
  "Pill Boxes & Bottles": "medication-adherence-tools",
  "Pillows": "lifestyle-and-home-other",
  "Pins": "badges-and-medallions",
  "Pitcher Sets": "bar-glassware-other",
  "Pitchers": "bar-glassware-other",
  "Place Mats": "kitchenware",
  "Planners & Organizers": "planners",
  "Planters": "garden",
  "Plants & Seeds & Flowers": "plants-and-seeds",
  "Plaque Accessories": "awards-other",
  "Plaques": "awards-other",
  "Plates": "kitchenware",
  "Playing Cards": "playing-cards",
  "Pocket Protectors": "desk-items-other",
  "Pointers": "gadgets",
  "Poker Chips": "playing-cards",
  "Poker Sets": "playing-cards",
  "Polishers": "car-accessories",
  "Portfolio Sets": "folders-portfolios",
  "Portfolios": "folders-portfolios",
  "Post Cards": "cards-envelopes-tags",
  "Poster Frames": "display-items-other",
  "Posters": "display-items-other",
  "Pot Holders & Oven Mitts": "kitchenware",
  "Pouches": "toiletry-bags",
  "Protectors": "safety-wear",
  "Punch Bowls": "bar-accessories",
  "Purifiers": "living-home",
  "Purses": "wallets-and-purses",
  "Puzzles & Tricks": "games-and-puzzles",
  "Racks": "living-home",
  "Radios": "radios",
  "Razors & Electric Shavers": "health-and-beauty-other",
  "Recorders": "audio-products-other",
  "Reflectors": "safety-wear",
  "Ribbon": "awards-other",
  "Robes": "clothing-other",
  "Rope & String": "tools",
  "Ropes": "camping-picnic",
  "Rugs": "living-home",
  "Rulers": "rulers",
  "Salad Sets": "kitchenware",
  "Salt & Pepper Shakers And Mills": "kitchenware",
  "Sashes": "apparel-accessories-other",
  "Scales": "patient-care-and-monitoring",
  "Scarves": "custom-scarves",
  "Scissors & Shears": "stationery-products-other",
  "Scoops": "kitchenware",
  "Scrapers": "ice-scrapers",
  "Seals": "stickers",
  "Seat Cushions": "seat-cushions",
  "Sewing Accessories & Kits": "lifestyle-and-home-other",
  "Sharpeners": "sharpeners",
  "Shaving Accessories & Kits": "health-and-beauty-other",
  "Sheets & Pillowcases": "lifestyle-and-home-other",
  "Shelves": "living-home",
  "Shirts": "shirts",
  "Shoe Shine Kits": "shoe-shine-kits",
  "Shoehorns & Shoe Trees": "custom-shoe-horns",
  "Shoelaces": "footwear",
  "Shoes": "footwear",
  "Shorts": "pants",
  "Shot Glasses": "bar-glassware-other",
  "Shovels": "tools",
  "Sign & Display Accessories": "display-items-other",
  "Signs & Displays": "display-items-other",
  "Sleeping Bags": "camping-picnic",
  "Slides & Film Strips": "office-and-desk-other",
  "Slippers": "slippers",
  "Snow Domes": "novelty-and-foam-other",
  "Soap": "soap",
  "Soap Dishes & Dispensers": "bathroom",
  "Soccer Balls": "soccer",
  "Socks": "branded-socks",
  "Souvenir Spoons": "kitchenware",
  "Spa Products": "health-and-beauty-other",
  "Speakers": "speakers",
  "Special Packaging": "office-and-desk-other",
  "Sponges & Sponge Holders": "kitchenware",
  "Sports Equipment & Access.": "sports-products-other",
  "Sports Memorabilia": "sports-products-other",
  "Sports Schedules": "sports-products-other",
  "Squeegees": "car-accessories",
  "Stadium Cups": "stadium-cups",
  "Stadium Seats": "seat-cushions",
  "Stamps": "stationery-products-other",
  "Stanchions": "display-items-other",
  "Stands": "stands-and-holders",
  "Staple Removers": "stationery-products-other",
  "Staplers": "stationery-products-other",
  "Stencils & Templates": "stationery-products-other",
  "Stirrers & Sticks-drink": "bar-accessories",
  "Stones": "lifestyle-and-home-other",
  "Stools": "chairs",
  "Stopwatches": "watches",
  "Straps": "apparel-accessories-other",
  "Straw Toppers": "straws",
  "Straws": "straws",
  "Streamers": "display-items-other",
  "Stress Cards": "stress-toys-other",
  "Stress Relievers": "stress-toys-other",
  "Stress Relievers > Balls": "stress-balls",
  "Stuffed Animals & Toys": "custom-teddy-bears",
  "Stuffed Animals & Toys Accessories": "custom-teddy-bears",
  "Suction Cups": "office-and-desk-other",
  "Sunglasses": "sunglasses-and-accessories",
  "Sunscreen": "health-and-beauty-other",
  "Suntan Lotions": "health-and-beauty-other",
  "Suspenders": "apparel-accessories-other",
  "Sweat Shirts": "sweatshirts",
  "Sweaters": "sweatshirts",
  "T-shirts": "clothing-t-shirts",
  "Tablecloths & Tablecloth Sets": "table-covers",
  "Tables": "chairs",
  "Tablet & E-reader Sleeves & Cases": "tablet-cases",
  "Tags": "cards-envelopes-tags",
  "Tape": "stationery-products-other",
  "Tape Dispensers": "stationery-products-other",
  "Tape Flags": "sticky-notes",
  "Tape Measures": "tape-measures",
  "Tassels": "novelty-and-foam-other",
  "Tattoos": "tattoos",
  "Tea Or Coffee Sets": "kitchenware",
  "Teapots/sets/infusers": "kitchenware",
  "Telescopes": "gadgets",
  "Tennis Balls": "sports-products-other",
  "Tents": "tents",
  "Testers": "gadgets",
  "Thermometers": "patient-care-and-monitoring",
  "Tiaras & Crowns": "novelty-and-foam-other",
  "Tiles": "living-home",
  "Timers": "kitchenware",
  "Tins": "mints-and-candy",
  "Tire Gauges": "car-accessories",
  "Tissues": "health-and-beauty-other",
  "Tobacco Related Products": "cigar-accessories",
  "Tool Belts": "tools",
  "Tool Boxes": "tools",
  "Tool Kits": "tools",
  "Tools-hardware": "tools",
  "Tools-kitchen": "kitchenware",
  "Toothbrushes": "health-and-beauty-other",
  "Toothpaste": "health-and-beauty-other",
  "Toothpicks": "kitchenware",
  "Tops & Spinners": "games-and-puzzles",
  "Tote Bags": "shopping-bags-other",
  "Tote Bags > Beach": "shopping-bags-other",
  "Tote Bags > Canvas": "canvas-bags",
  "Tote Bags > Insulated": "cooler-bags",
  "Tote Bags > Jute": "jute-bags",
  "Tote Bags > Non Woven": "non-woven-bags",
  "Towelettes": "infection-control-and-ppe",
  "Towels": "bathroom",
  "Toys": "novelty-and-foam-other",
  "Trade Show Displays": "display-items-other",
  "Trading Cards": "playing-cards",
  "Trading Pins": "badges-and-medallions",
  "Training Programs": "office-and-desk-other",
  "Trash Cans": "living-home",
  "Travel Amenities": "travel-bags",
  "Travel Mugs/cups": "travel-mugs",
  "Trays": "kitchenware",
  "Trivets": "kitchenware",
  "Tv's & Tv Accessories": "gadgets",
  "Umbrellas": "umbrellas-other",
  "Uniforms": "clothing-other",
  "Usb Hubs": "usb-hubs",
  "Usb/flash Drives": "usb-other",
  "Uv Sanitizers": "infection-control-and-ppe",
  "Valuable Paper Holders": "folders-portfolios",
  "Vases": "living-home",
  "Vests": "jackets",
  "Video Equipment": "gadgets",
  "Volleyballs": "sports-products-other",
  "Walkie Talkie": "gadgets",
  "Wall Tapestries & Murals": "living-home",
  "Wallets": "wallets-and-purses",
  "Wands & Scepters": "novelty-and-foam-other",
  "Warmers": "living-home",
  "Washcloths": "bathroom",
  "Watches": "watches",
  "Weather Predictors": "gadgets",
  "Whistles": "noise-makers",
  "Windsocks": "flags",
  "Wine Accessories": "wine-products",
  "Wine Chillers": "wine-products",
  "Wine Glasses": "bar-glassware-other",
  "World Timers": "clocks",
  "Wrist Rests": "mouse-pads",
  "Wristbands": "wristbands",
  "Write On-wipe Off Boards": "memo-clips-and-memo-boards",
  "Yardsticks": "tape-measures",
  "Yo-yo's": "games-and-puzzles",
  "Zipper Pullers": "apparel-accessories-other"
};

export const UNMAPPED_ASI: string[] = [
  "Boxes",
  "Cases & Holders",
  "Covers",
  "Custom Products",
  "Education Programs",
  "Gift Sets",
  "Kits",
  "Mobile Apps",
  "Packaging Boxes",
  "Special Packaging"
];
