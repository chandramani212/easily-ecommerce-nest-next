import type {
  AdminUser,
  Category,
  ContactMessage,
  Customer,
  Inquiry,
  MediaAsset,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductAttribute,
  Settings,
  Source,
  SourceImport,
  SourceImportRun,
  SourceImportSummary,
  SourceProductLinkEntry,
} from "./types";

const now = new Date("2026-04-18T10:30:00Z");
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 86400000).toISOString();

export const mockCategories: Category[] = [
  {
    id: "cat-apparel",
    name: "Apparel",
    slug: "apparel",
    parentId: null,
    image: null,
    _count: { products: 4 },
    createdAt: daysAgo(120),
  },
  {
    id: "cat-drinkware",
    name: "Drinkware",
    slug: "drinkware",
    parentId: null,
    image: null,
    _count: { products: 3 },
    createdAt: daysAgo(118),
  },
  {
    id: "cat-stationery",
    name: "Stationery",
    slug: "stationery",
    parentId: null,
    image: null,
    _count: { products: 3 },
    createdAt: daysAgo(115),
  },
  {
    id: "cat-bags",
    name: "Bags & Totes",
    slug: "bags",
    parentId: null,
    image: null,
    _count: { products: 2 },
    createdAt: daysAgo(100),
  },
  {
    id: "cat-tech",
    name: "Tech & Accessories",
    slug: "tech",
    parentId: null,
    image: null,
    _count: { products: 2 },
    createdAt: daysAgo(90),
  },
];

const categoryById = (id: string) => {
  const c = mockCategories.find((cc) => cc.id === id)!;
  return { id: c.id, name: c.name, slug: c.slug };
};

const seededImages = (sku: string, count = 2): string[] =>
  Array.from(
    { length: count },
    (_, i) => `https://picsum.photos/seed/${sku}-${i}/600/600`,
  );

interface SeedTier {
  id: string;
  minQuantity: number;
  price: string;
  type?: "FIXED" | "PERCENTAGE";
}

interface ProductSeed {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  basePrice: string;
  sellingPrice: string;
  active: boolean;
  categoryIds: string[];
  attributes?: ProductAttribute[];
  tierPrices: SeedTier[];
  daysOld: number;
  daysSince: number;
}

const productSeeds: ProductSeed[] = [
  {
    id: "prod-tee-classic",
    name: "Classic Cotton Tee",
    slug: "classic-cotton-tee",
    sku: "APP-TEE-001",
    shortDescription: "Soft-washed 100% ringspun cotton tee.",
    description:
      "Our bestselling 100% ringspun cotton tee. Soft-washed for an instantly broken-in feel.",
    basePrice: "15.99",
    sellingPrice: "12.99",
    active: true,
    categoryIds: ["cat-apparel"],
    attributes: [
      { name: "Material", value: "100% ringspun cotton" },
      { name: "Weight", value: "180gsm" },
      { name: "Sizes", value: "XS, S, M, L, XL, 2XL" },
    ],
    tierPrices: [
      { id: "tp-1", minQuantity: 25, price: "11.49" },
      { id: "tp-2", minQuantity: 100, price: "9.99" },
      { id: "tp-3", minQuantity: 500, price: "7.99" },
    ],
    daysOld: 60,
    daysSince: 3,
  },
  {
    id: "prod-hoodie",
    name: "Premium Pullover Hoodie",
    slug: "premium-hoodie",
    sku: "APP-HOOD-010",
    shortDescription: "Heavyweight 380gsm fleece pullover hoodie.",
    description:
      "Heavyweight 380gsm fleece with double-layer hood and kangaroo pocket.",
    basePrice: "42.00",
    sellingPrice: "34.50",
    active: true,
    categoryIds: ["cat-apparel"],
    attributes: [
      { name: "Material", value: "80% cotton / 20% polyester fleece" },
      { name: "Weight", value: "380gsm" },
    ],
    tierPrices: [
      { id: "tp-4", minQuantity: 24, price: "10", type: "PERCENTAGE" },
      { id: "tp-5", minQuantity: 100, price: "20", type: "PERCENTAGE" },
      { id: "tp-5b", minQuantity: 250, price: "27.50" },
    ],
    daysOld: 55,
    daysSince: 12,
  },
  {
    id: "prod-polo",
    name: "Embroidered Performance Polo",
    slug: "embroidered-polo",
    sku: "APP-POLO-022",
    shortDescription: "Moisture-wicking piqué polo for corporate events.",
    description:
      "Moisture-wicking piqué polo, ready for corporate events.",
    basePrice: "26.00",
    sellingPrice: "22.00",
    active: true,
    categoryIds: ["cat-apparel"],
    attributes: [
      { name: "Material", value: "Performance polyester piqué" },
      { name: "Care", value: "Machine washable" },
    ],
    tierPrices: [{ id: "tp-6", minQuantity: 50, price: "18.75" }],
    daysOld: 40,
    daysSince: 2,
  },
  {
    id: "prod-cap",
    name: "Structured 6-Panel Cap",
    slug: "structured-cap",
    sku: "APP-CAP-004",
    shortDescription: "Mid-profile structured cap with adjustable strap.",
    description:
      "Mid-profile cap with structured front and adjustable strap.",
    basePrice: "11.00",
    sellingPrice: "9.50",
    active: false,
    categoryIds: ["cat-apparel"],
    tierPrices: [],
    daysOld: 35,
    daysSince: 30,
  },
  {
    id: "prod-mug",
    name: "Ceramic Coffee Mug 11oz",
    slug: "coffee-mug",
    sku: "DRK-MUG-001",
    shortDescription: "Dishwasher-safe ceramic mug with full-color wrap.",
    description:
      "Dishwasher-safe white ceramic mug with full-color wrap.",
    basePrice: "8.50",
    sellingPrice: "6.25",
    active: true,
    categoryIds: ["cat-drinkware"],
    attributes: [
      { name: "Capacity", value: "11oz" },
      { name: "Material", value: "Stoneware ceramic" },
    ],
    tierPrices: [
      { id: "tp-7", minQuantity: 36, price: "5.50" },
      { id: "tp-8", minQuantity: 144, price: "4.25" },
    ],
    daysOld: 75,
    daysSince: 5,
  },
  {
    id: "prod-bottle",
    name: "Insulated Water Bottle 20oz",
    slug: "water-bottle",
    sku: "DRK-BOT-002",
    shortDescription: "Double-wall vacuum insulated bottle. Cold 24h, hot 12h.",
    description:
      "Double-wall vacuum insulated; keeps cold 24h, hot 12h.",
    basePrice: "22.00",
    sellingPrice: "18.00",
    active: true,
    categoryIds: ["cat-drinkware", "cat-tech"],
    attributes: [
      { name: "Capacity", value: "20oz / 590ml" },
      { name: "Material", value: "18/8 stainless steel" },
    ],
    tierPrices: [{ id: "tp-9", minQuantity: 48, price: "15.00" }],
    daysOld: 50,
    daysSince: 8,
  },
  {
    id: "prod-tumbler",
    name: "Copper-Lined Tumbler 16oz",
    slug: "copper-tumbler",
    sku: "DRK-TUM-007",
    shortDescription: "Matte powder-coated tumbler with laser engraving area.",
    description:
      "Matte powder-coated tumbler with laser engraving area.",
    basePrice: "28.00",
    sellingPrice: "24.00",
    active: true,
    categoryIds: ["cat-drinkware"],
    tierPrices: [
      { id: "tp-10", minQuantity: 50, price: "21.00" },
      { id: "tp-11", minQuantity: 200, price: "18.50" },
    ],
    daysOld: 28,
    daysSince: 1,
  },
  {
    id: "prod-notebook",
    name: "Hardcover Notebook A5",
    slug: "hardcover-notebook",
    sku: "STA-NB-001",
    shortDescription: "160-page dot-grid notebook with elastic closure.",
    description:
      "160 page dot-grid notebook with elastic closure and ribbon.",
    basePrice: "10.50",
    sellingPrice: "8.75",
    active: true,
    categoryIds: ["cat-stationery"],
    attributes: [
      { name: "Pages", value: "160 (dot grid)" },
      { name: "Format", value: "A5" },
    ],
    tierPrices: [{ id: "tp-12", minQuantity: 25, price: "7.50" }],
    daysOld: 85,
    daysSince: 15,
  },
  {
    id: "prod-pen",
    name: "Metal Click Pen",
    slug: "metal-click-pen",
    sku: "STA-PEN-003",
    shortDescription: "Brushed aluminum click pen with smooth blue ink.",
    description:
      "Brushed aluminum click pen, blue ink, smooth writing.",
    basePrice: "4.20",
    sellingPrice: "3.20",
    active: true,
    categoryIds: ["cat-stationery"],
    tierPrices: [
      { id: "tp-13", minQuantity: 100, price: "2.75" },
      { id: "tp-14", minQuantity: 500, price: "2.10" },
    ],
    daysOld: 70,
    daysSince: 9,
  },
  {
    id: "prod-sticker",
    name: "Die-Cut Sticker Pack",
    slug: "sticker-pack",
    sku: "STA-STK-012",
    shortDescription: "Weatherproof vinyl stickers, custom shapes up to 4\".",
    description:
      "Weatherproof vinyl stickers, custom shapes up to 4 inches.",
    basePrice: "2.50",
    sellingPrice: "2.00",
    active: false,
    categoryIds: ["cat-stationery"],
    tierPrices: [],
    daysOld: 22,
    daysSince: 22,
  },
  {
    id: "prod-tote",
    name: "Heavyweight Canvas Tote",
    slug: "canvas-tote",
    sku: "BAG-TOT-001",
    shortDescription: "12oz natural canvas tote with reinforced straps.",
    description:
      "12oz natural canvas tote with reinforced shoulder straps.",
    basePrice: "11.50",
    sellingPrice: "9.80",
    active: true,
    categoryIds: ["cat-bags"],
    attributes: [{ name: "Material", value: "12oz natural canvas" }],
    tierPrices: [{ id: "tp-15", minQuantity: 100, price: "7.40" }],
    daysOld: 45,
    daysSince: 4,
  },
  {
    id: "prod-backpack",
    name: "Urban Commuter Backpack",
    slug: "commuter-backpack",
    sku: "BAG-BP-002",
    shortDescription: "Water-resistant backpack with laptop sleeve.",
    description:
      "Water-resistant backpack with laptop sleeve and USB passthrough.",
    basePrice: "55.00",
    sellingPrice: "48.00",
    active: true,
    categoryIds: ["cat-bags", "cat-tech"],
    attributes: [
      { name: "Capacity", value: "22L" },
      { name: "Laptop", value: "Up to 15.6\"" },
    ],
    tierPrices: [
      { id: "tp-16", minQuantity: 25, price: "12.5", type: "PERCENTAGE" },
      { id: "tp-16b", minQuantity: 100, price: "36.00" },
    ],
    daysOld: 20,
    daysSince: 6,
  },
  {
    id: "prod-powerbank",
    name: "10,000mAh Power Bank",
    slug: "power-bank",
    sku: "TEC-PB-001",
    shortDescription: "Slim aluminum power bank with dual USB-C output.",
    description:
      "Slim aluminum power bank with dual USB-C output.",
    basePrice: "32.00",
    sellingPrice: "26.00",
    active: true,
    categoryIds: ["cat-tech"],
    attributes: [
      { name: "Capacity", value: "10,000mAh" },
      { name: "Output", value: "Dual USB-C 20W" },
    ],
    tierPrices: [{ id: "tp-17", minQuantity: 50, price: "22.00" }],
    daysOld: 18,
    daysSince: 2,
  },
  {
    id: "prod-mousepad",
    name: "Custom Desk Mousepad XL",
    slug: "desk-mousepad",
    sku: "TEC-MP-004",
    shortDescription: "Full-size 900×400mm desk mat with stitched edges.",
    description:
      "Full-size desk mat with stitched edges, 900x400mm.",
    basePrice: "23.00",
    sellingPrice: "19.50",
    active: true,
    categoryIds: ["cat-tech"],
    tierPrices: [{ id: "tp-18", minQuantity: 50, price: "16.00" }],
    daysOld: 12,
    daysSince: 1,
  },
];

const relatedMap: Record<string, string[]> = {
  "prod-tee-classic": ["prod-polo", "prod-hoodie", "prod-cap"],
  "prod-hoodie": ["prod-tee-classic", "prod-polo"],
  "prod-polo": ["prod-tee-classic", "prod-hoodie"],
  "prod-mug": ["prod-bottle", "prod-tumbler"],
  "prod-bottle": ["prod-mug", "prod-tumbler", "prod-backpack"],
  "prod-tumbler": ["prod-mug", "prod-bottle"],
  "prod-notebook": ["prod-pen", "prod-sticker"],
  "prod-tote": ["prod-backpack"],
  "prod-backpack": ["prod-tote", "prod-powerbank"],
  "prod-powerbank": ["prod-backpack", "prod-mousepad"],
};

export const mockProducts: Product[] = productSeeds.map((seed) => {
  const product: Product = {
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    sku: seed.sku,
    shortDescription: seed.shortDescription,
    description: seed.description,
    basePrice: seed.basePrice,
    sellingPrice: seed.sellingPrice,
    images: seededImages(seed.sku, 2),
    active: seed.active,
    attributes: seed.attributes ?? [],
    categories: seed.categoryIds.map(categoryById),
    relatedTo: [],
    tierPrices: seed.tierPrices.map((t) => {
      const type = t.type ?? "FIXED";
      const selling = Number(seed.sellingPrice);
      const price = Number(t.price);
      const effective =
        type === "PERCENTAGE"
          ? +(selling * (1 - Math.max(0, Math.min(100, price)) / 100)).toFixed(
              2,
            )
          : +price.toFixed(2);
      return {
        id: t.id,
        minQuantity: t.minQuantity,
        type,
        price: t.price,
        effectivePrice: effective,
      };
    }),
    createdAt: daysAgo(seed.daysOld),
    updatedAt: daysAgo(seed.daysSince),
  };
  return product;
});

// Resolve related references after the array is built so we can hydrate summaries.
for (const p of mockProducts) {
  const ids = relatedMap[p.id] ?? [];
  p.relatedTo = ids
    .map((rid) => mockProducts.find((mp) => mp.id === rid))
    .filter((x): x is Product => Boolean(x))
    .map((mp) => ({
      id: mp.id,
      name: mp.name,
      slug: mp.slug,
      sku: mp.sku,
      basePrice: mp.basePrice,
      sellingPrice: mp.sellingPrice,
      images: mp.images,
      active: mp.active,
    }));
}

const orderItem = (
  id: string,
  product: Product,
  quantity: number,
): OrderItem => {
  const unit = Number(product.basePrice);
  return {
    id,
    productId: product.id,
    name: product.name,
    quantity,
    unitPrice: unit.toFixed(2),
    lineTotal: (unit * quantity).toFixed(2),
  };
};

const buildOrder = (
  i: number,
  customerId: string,
  status: OrderStatus,
  items: OrderItem[],
  daysOffset: number,
): Order => {
  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.unitPrice) * it.quantity,
    0,
  );
  const shipping = 9.99;
  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);
  return {
    id: `order-${i}`,
    orderNumber: `SO-${10000 + i}`,
    customerId,
    status,
    subtotal: subtotal.toFixed(2),
    shipping: shipping.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
    shippingAddress: {
      line1: "123 Market Street",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
      country: "US",
    },
    items,
    _count: { items: items.length },
    createdAt: daysAgo(daysOffset),
  };
};

export const mockCustomers: Customer[] = [
  {
    id: "cust-1",
    firstName: "Amelia",
    lastName: "Carter",
    email: "amelia@brightlabs.io",
    phone: "+1 512-555-0144",
    company: "Bright Labs",
    _count: { orders: 3 },
    createdAt: daysAgo(180),
  },
  {
    id: "cust-2",
    firstName: "Benjamin",
    lastName: "Ortiz",
    email: "b.ortiz@northstar.co",
    phone: "+1 646-555-0101",
    company: "Northstar Co.",
    _count: { orders: 2 },
    createdAt: daysAgo(145),
  },
  {
    id: "cust-3",
    firstName: "Chidinma",
    lastName: "Okafor",
    email: "chidi@mercerstudios.com",
    phone: "+1 415-555-0177",
    company: "Mercer Studios",
    _count: { orders: 4 },
    createdAt: daysAgo(110),
  },
  {
    id: "cust-4",
    firstName: "Daniel",
    lastName: "Kim",
    email: "dan.kim@zincventures.com",
    phone: "+1 206-555-0163",
    company: "Zinc Ventures",
    _count: { orders: 1 },
    createdAt: daysAgo(80),
  },
  {
    id: "cust-5",
    firstName: "Eloise",
    lastName: "Rousseau",
    email: "eloise@maisonrousseau.fr",
    phone: "+33 1 82 88 0055",
    company: "Maison Rousseau",
    _count: { orders: 2 },
    createdAt: daysAgo(60),
  },
  {
    id: "cust-6",
    firstName: "Farhan",
    lastName: "Siddiqui",
    email: "farhan@apextech.io",
    phone: "+1 312-555-0188",
    company: "Apex Tech",
    _count: { orders: 2 },
    createdAt: daysAgo(45),
  },
  {
    id: "cust-7",
    firstName: "Grace",
    lastName: "Tanaka",
    email: "grace@tanakadesign.jp",
    phone: "+81 3-5555-0144",
    company: "Tanaka Design",
    _count: { orders: 1 },
    createdAt: daysAgo(30),
  },
  {
    id: "cust-8",
    firstName: "Henry",
    lastName: "Blake",
    email: "henry.blake@thewellhouse.co.uk",
    phone: "+44 20 7946 0018",
    company: "The Wellhouse",
    _count: { orders: 1 },
    createdAt: daysAgo(14),
  },
];

export const mockOrders: Order[] = [
  buildOrder(
    1,
    "cust-1",
    "DELIVERED",
    [
      orderItem("oi-1-1", mockProducts[0]!, 100),
      orderItem("oi-1-2", mockProducts[4]!, 50),
    ],
    45,
  ),
  buildOrder(
    2,
    "cust-1",
    "DELIVERED",
    [orderItem("oi-2-1", mockProducts[1]!, 24)],
    30,
  ),
  buildOrder(
    3,
    "cust-1",
    "SHIPPED",
    [orderItem("oi-3-1", mockProducts[12]!, 50)],
    4,
  ),
  buildOrder(
    4,
    "cust-2",
    "DELIVERED",
    [orderItem("oi-4-1", mockProducts[5]!, 48)],
    60,
  ),
  buildOrder(
    5,
    "cust-2",
    "PROCESSING",
    [orderItem("oi-5-1", mockProducts[10]!, 100)],
    2,
  ),
  buildOrder(
    6,
    "cust-3",
    "DELIVERED",
    [
      orderItem("oi-6-1", mockProducts[0]!, 250),
      orderItem("oi-6-2", mockProducts[2]!, 50),
    ],
    72,
  ),
  buildOrder(
    7,
    "cust-3",
    "DELIVERED",
    [orderItem("oi-7-1", mockProducts[7]!, 25)],
    55,
  ),
  buildOrder(
    8,
    "cust-3",
    "SHIPPED",
    [
      orderItem("oi-8-1", mockProducts[6]!, 50),
      orderItem("oi-8-2", mockProducts[8]!, 100),
    ],
    6,
  ),
  buildOrder(
    9,
    "cust-3",
    "PENDING",
    [orderItem("oi-9-1", mockProducts[11]!, 25)],
    1,
  ),
  buildOrder(
    10,
    "cust-4",
    "CANCELLED",
    [orderItem("oi-10-1", mockProducts[3]!, 75)],
    50,
  ),
  buildOrder(
    11,
    "cust-5",
    "DELIVERED",
    [orderItem("oi-11-1", mockProducts[4]!, 144)],
    28,
  ),
  buildOrder(
    12,
    "cust-5",
    "PROCESSING",
    [orderItem("oi-12-1", mockProducts[13]!, 50)],
    3,
  ),
  buildOrder(
    13,
    "cust-6",
    "SHIPPED",
    [orderItem("oi-13-1", mockProducts[8]!, 500)],
    10,
  ),
  buildOrder(
    14,
    "cust-6",
    "DELIVERED",
    [orderItem("oi-14-1", mockProducts[1]!, 100)],
    22,
  ),
  buildOrder(
    15,
    "cust-7",
    "PENDING",
    [orderItem("oi-15-1", mockProducts[12]!, 25)],
    0,
  ),
  buildOrder(
    16,
    "cust-8",
    "PROCESSING",
    [
      orderItem("oi-16-1", mockProducts[0]!, 50),
      orderItem("oi-16-2", mockProducts[4]!, 36),
    ],
    1,
  ),
];

attachCustomersToOrders();

function attachCustomersToOrders() {
  for (const order of mockOrders) {
    const customer = mockCustomers.find((c) => c.id === order.customerId);
    if (customer) {
      order.customer = customer;
    }
  }
}

export function customerWithOrders(id: string): Customer | undefined {
  const base = mockCustomers.find((c) => c.id === id);
  if (!base) return undefined;
  const orders = mockOrders
    .filter((o) => o.customerId === id)
    .map((o) => ({ ...o, customer: undefined }));
  return { ...base, orders };
}

export const mockInquiries: Inquiry[] = [
  {
    id: "inq-1",
    inquiryType: "Instant Quote",
    productName: "Classic Cotton Tee",
    name: "Jordan Rivers",
    email: "jordan@sparkschool.org",
    phone: "+1 720-555-0113",
    company: "Spark School",
    quantity: "250",
    message:
      "We're running an end-of-year event and need 250 tees in assorted sizes. Can you include two-color screen print on the front?",
    status: "NEW",
    createdAt: daysAgo(0),
  },
  {
    id: "inq-2",
    inquiryType: "Free Visual",
    productName: "Premium Pullover Hoodie",
    name: "Priya Shah",
    email: "priya@sundrip.cafe",
    phone: "+1 415-555-0150",
    company: "Sundrip Cafe",
    quantity: "60",
    message:
      "Looking for hoodies for our staff. Could you mock up our logo on the left chest and full-color back print?",
    status: "NEW",
    createdAt: daysAgo(1),
  },
  {
    id: "inq-3",
    inquiryType: "Order a Sample",
    productName: "Copper-Lined Tumbler 16oz",
    name: "Marcus Whitfield",
    email: "marcus@graniterowing.com",
    phone: null,
    company: "Granite Rowing Club",
    quantity: "1",
    message: "Need a physical sample before placing an order of 200 units.",
    status: "IN_PROGRESS",
    createdAt: daysAgo(2),
  },
  {
    id: "inq-4",
    inquiryType: "Instant Quote",
    productName: null,
    name: "Leila Nasser",
    email: "leila@foldpapers.co",
    phone: "+971 50 123 0987",
    company: "Fold Papers Co.",
    quantity: "1000",
    message: "Interested in stationery bundle pricing — notebook + pen set.",
    status: "IN_PROGRESS",
    createdAt: daysAgo(4),
  },
  {
    id: "inq-5",
    inquiryType: "Order Online",
    productName: "Insulated Water Bottle 20oz",
    name: "Owen Delacroix",
    email: "owen@delacroixrunclub.com",
    phone: "+1 305-555-0185",
    company: "Delacroix Run Club",
    quantity: "80",
    message: "Would like to finalize an order for the upcoming marathon.",
    status: "CLOSED",
    createdAt: daysAgo(9),
  },
  {
    id: "inq-6",
    inquiryType: "Free Visual",
    productName: "Urban Commuter Backpack",
    name: "Sara Bergstrom",
    email: "sara@northfork.studio",
    phone: null,
    company: "Northfork Studio",
    quantity: "40",
    message: "Please mockup our wordmark on the strap and front panel.",
    status: "CLOSED",
    createdAt: daysAgo(14),
  },
];

export const mockContactMessages: ContactMessage[] = [
  {
    id: "msg-1",
    firstName: "Alex",
    lastName: "Watanabe",
    email: "alex.w@example.com",
    subject: "Order Inquiry",
    message:
      "Hi, I placed an order yesterday (SO-10015) but haven't received confirmation yet. Could you check on it?",
    status: "NEW",
    createdAt: daysAgo(0),
  },
  {
    id: "msg-2",
    firstName: "Bianca",
    lastName: "Romero",
    email: "bianca@romerocreative.co",
    subject: "Product Question",
    message:
      "Do the canvas totes come in darker colors? I'd like to see navy or black options for a client.",
    status: "NEW",
    createdAt: daysAgo(1),
  },
  {
    id: "msg-3",
    firstName: "Caleb",
    lastName: "Huang",
    email: "caleb.h@thegoodco.com",
    subject: "Returns & Refunds",
    message:
      "A small portion of the tumblers in our last order arrived dented. Can we arrange a partial return?",
    status: "READ",
    createdAt: daysAgo(3),
  },
  {
    id: "msg-4",
    firstName: "Dana",
    lastName: "Velasquez",
    email: "dana@studiolux.design",
    subject: "Feedback",
    message:
      "Wanted to say the new hoodie quality is noticeably better than our order last year — great work.",
    status: "READ",
    createdAt: daysAgo(6),
  },
  {
    id: "msg-5",
    firstName: "Emeka",
    lastName: "Obi",
    email: "emeka@obi.agency",
    subject: "Other",
    message:
      "Do you offer white-label fulfilment for recurring monthly swag drops?",
    status: "REPLIED",
    createdAt: daysAgo(10),
  },
];

export const mockAdminUsers: AdminUser[] = [
  {
    id: "user-1",
    email: "admin@shopease.demo",
    name: "Demo Admin",
    role: "ADMIN",
    createdAt: daysAgo(180),
  },
  {
    id: "user-2",
    email: "maria@shopease.demo",
    name: "Maria Chen",
    role: "MANAGER",
    createdAt: daysAgo(90),
  },
  {
    id: "user-3",
    email: "jordan@shopease.demo",
    name: "Jordan Patel",
    role: "STAFF",
    createdAt: daysAgo(30),
  },
  {
    id: "user-4",
    email: "sam@shopease.demo",
    name: "Sam Okeke",
    role: "STAFF",
    createdAt: daysAgo(12),
  },
];

export const mockSettings: Settings = {
  id: 1,
  smtpHost: "smtp.mailtrap.io",
  smtpPort: 587,
  smtpUser: "demo-user",
  smtpPassSet: true,
  smtpFrom: "no-reply@easilyadmin.demo",
  smtpSecure: false,
  notifyTo: "hello@easilyadmin.demo",
};

const seedMedia = (i: number, name: string, daysOldOf: number): MediaAsset => ({
  id: `media-${i}`,
  filename: `${i}-${name}.jpg`,
  originalName: `${name}.jpg`,
  url: `https://picsum.photos/seed/media-${i}-${name}/600/600`,
  mimeType: "image/jpeg",
  size: 120_000 + i * 4_321,
  width: 600,
  height: 600,
  alt: null,
  uploadedById: "user-1",
  createdAt: daysAgo(daysOldOf),
});

export const mockMediaAssets: MediaAsset[] = [
  seedMedia(1, "tee-front", 30),
  seedMedia(2, "tee-back", 30),
  seedMedia(3, "hoodie-charcoal", 25),
  seedMedia(4, "polo-navy", 22),
  seedMedia(5, "cap-front", 20),
  seedMedia(6, "mug-white", 18),
  seedMedia(7, "mug-stack", 18),
  seedMedia(8, "bottle-matte", 15),
  seedMedia(9, "tumbler-copper", 12),
  seedMedia(10, "notebook-cover", 10),
  seedMedia(11, "pen-detail", 9),
  seedMedia(12, "stickers", 7),
  seedMedia(13, "tote-canvas", 6),
  seedMedia(14, "backpack-front", 5),
  seedMedia(15, "powerbank-aluminum", 4),
  seedMedia(16, "mousepad-xl", 3),
  seedMedia(17, "warehouse-shot", 2),
  seedMedia(18, "lifestyle-bag", 1),
  seedMedia(19, "lifestyle-tee", 1),
  seedMedia(20, "shop-banner", 0),
];

/* ---- Sources (demo). ------------------------------------------------- */

const sourceImportSummary = (
  imp: SourceImport,
): SourceImportSummary => ({
  id: imp.id,
  name: imp.name,
  format: imp.format,
  cron: imp.cron,
  active: imp.active,
  lastRunAt: imp.lastRunAt,
  lastStatus: imp.lastStatus,
  createdAt: imp.createdAt,
  updatedAt: imp.updatedAt,
});

export const mockSourceImports: SourceImport[] = [
  {
    id: "imp-1",
    sourceId: "sup-printpartner",
    name: "Apparel daily sync",
    format: "JSON",
    cron: "0 */6 * * *",
    active: true,
    lastRunAt: daysAgo(0),
    lastStatus: "SUCCESS",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(0),
    endpoint: "/products.json",
    httpMethod: "GET",
    headers: { Accept: "application/json" },
    body: null,
    recordsPath: "$.products[*]",
    autoDeactivateMissing: true,
    mapping: {
      externalId: { path: "id" },
      name: { path: "title" },
      sku: { path: "sku" },
      shortDescription: { path: "subtitle" },
      description: { path: "body_html" },
      basePrice: { path: "msrp", transforms: ["money"] },
      sellingPrice: { path: "price", transforms: ["money"] },
      active: { path: "available", transforms: ["bool"] },
      images: { source: { path: "images[*].src" } },
      categories: {
        source: { path: "tags" },
        separator: ",",
        match: "create",
      },
      attributes: [
        { name: "Material", value: { path: "material" } },
        { name: "Fit", value: { path: "fit" } },
      ],
      tiers: [],
    },
    markup: { kind: "percent", value: 15, appliesTo: ["sellingPrice"] },
  },
  {
    id: "imp-2",
    sourceId: "sup-printpartner",
    name: "Hourly inventory delta",
    format: "JSON",
    cron: "*/30 * * * *",
    active: false,
    lastRunAt: daysAgo(7),
    lastStatus: "PARTIAL",
    createdAt: daysAgo(40),
    updatedAt: daysAgo(7),
    endpoint: "/inventory.json",
    httpMethod: "GET",
    headers: {},
    body: null,
    recordsPath: "$.items[*]",
    autoDeactivateMissing: false,
    mapping: {
      externalId: { path: "sku" },
      name: { path: "name" },
      sku: { path: "sku" },
      sellingPrice: { path: "price", transforms: ["money"] },
    },
    markup: { kind: "percent", value: 0, appliesTo: ["sellingPrice"] },
  },
  {
    id: "imp-3",
    sourceId: "sup-eurofeed",
    name: "Euro CSV catalog",
    format: "CSV",
    cron: "",
    active: true,
    lastRunAt: daysAgo(2),
    lastStatus: "SUCCESS",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
    endpoint: null,
    httpMethod: "GET",
    headers: {},
    body: null,
    recordsPath: "$",
    autoDeactivateMissing: false,
    mapping: {
      externalId: { path: "code" },
      name: { path: "name" },
      sku: { path: "code" },
      sellingPrice: { path: "price_eur", transforms: ["money"] },
      categories: { source: { path: "categories" }, separator: "|", match: "create" },
    },
    markup: { kind: "fixed", value: 2, appliesTo: ["sellingPrice"] },
  },
];

export const mockSources: Source[] = [
  {
    id: "sup-printpartner",
    name: "PrintPartner Apparel",
    kind: "REST",
    baseUrl: "https://api.printpartner.example.com/v2",
    authType: "BEARER",
    defaultMarkupPct: 15,
    notes: "POD apparel fulfillment partner.",
    active: true,
    productCount: 12,
    importCount: 2,
    authConfigured: true,
    imports: mockSourceImports
      .filter((imp) => imp.sourceId === "sup-printpartner")
      .map(sourceImportSummary),
    createdAt: daysAgo(45),
    updatedAt: daysAgo(0),
  },
  {
    id: "sup-eurofeed",
    name: "EuroFeed Distributors",
    kind: "FILE_FEED",
    baseUrl: null,
    authType: "NONE",
    defaultMarkupPct: 0,
    notes: "CSV catalog uploaded weekly.",
    active: true,
    productCount: 6,
    importCount: 1,
    authConfigured: false,
    imports: mockSourceImports
      .filter((imp) => imp.sourceId === "sup-eurofeed")
      .map(sourceImportSummary),
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  },
  {
    id: "sup-novacrafts",
    name: "Nova Crafts API",
    kind: "REST",
    baseUrl: "https://api.novacrafts.example.com",
    authType: "API_KEY",
    defaultMarkupPct: 22,
    notes: "Boutique handcrafted items.",
    active: false,
    productCount: 0,
    importCount: 0,
    authConfigured: true,
    imports: [],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
];

const seedRun = (
  id: string,
  importId: string,
  status: SourceImportRun["status"],
  daysOld: number,
  totals: Partial<Pick<SourceImportRun, "created" | "updated" | "skipped" | "failed">>,
  errors: SourceImportRun["errors"] = [],
): SourceImportRun => ({
  id,
  importId,
  status,
  triggeredBy: daysOld % 2 === 0 ? "SCHEDULE" : "MANUAL",
  startedAt: daysAgo(daysOld),
  finishedAt: new Date(
    new Date(daysAgo(daysOld)).getTime() + 4500,
  ).toISOString(),
  created: totals.created ?? 0,
  updated: totals.updated ?? 0,
  skipped: totals.skipped ?? 0,
  failed: totals.failed ?? 0,
  errors,
});

export const mockSourceRuns: SourceImportRun[] = [
  seedRun("run-1", "imp-1", "SUCCESS", 0, { updated: 12 }),
  seedRun("run-2", "imp-1", "SUCCESS", 1, { created: 1, updated: 11 }),
  seedRun("run-3", "imp-1", "PARTIAL", 2, { updated: 10, failed: 2 }, [
    { record: 7, externalId: "PP-771", error: "Missing required field 'sku'" },
    { record: 11, externalId: "PP-902", error: "Invalid price 'TBD'" },
  ]),
  seedRun("run-4", "imp-1", "SUCCESS", 3, { updated: 12 }),
  seedRun("run-5", "imp-2", "PARTIAL", 7, { updated: 25, failed: 4 }, [
    { record: 0, error: "Auth refresh failed" },
  ]),
  seedRun("run-6", "imp-3", "SUCCESS", 2, { created: 4, updated: 2 }),
  seedRun("run-7", "imp-3", "SUCCESS", 9, { created: 6 }),
];

const productLinkSeeds: { sourceId: string; entries: { externalId: string; productIndex: number; daysOld: number }[] }[] = [
  {
    sourceId: "sup-printpartner",
    entries: [
      { externalId: "PP-100", productIndex: 0, daysOld: 0 },
      { externalId: "PP-101", productIndex: 1, daysOld: 0 },
      { externalId: "PP-102", productIndex: 2, daysOld: 0 },
      { externalId: "PP-103", productIndex: 3, daysOld: 1 },
    ],
  },
  {
    sourceId: "sup-eurofeed",
    entries: [
      { externalId: "EU-NB-01", productIndex: 4, daysOld: 2 },
      { externalId: "EU-PEN-01", productIndex: 5, daysOld: 2 },
    ],
  },
];

export const mockSourceProductLinks: Record<string, SourceProductLinkEntry[]> =
  Object.fromEntries(
    productLinkSeeds.map(({ sourceId, entries }) => [
      sourceId,
      entries
        .map(({ externalId, productIndex, daysOld }) => {
          const product = mockProducts[productIndex];
          if (!product) return null;
          return {
            externalId,
            lastSeenAt: daysAgo(daysOld),
            product: {
              id: product.id,
              name: product.name,
              sku: product.sku,
              slug: product.slug,
              sellingPrice: product.sellingPrice,
              basePrice: product.basePrice,
              active: product.active,
              images: product.images,
            },
          };
        })
        .filter((x): x is SourceProductLinkEntry => x !== null),
    ]),
  );

export function computeSummary() {
  const revenue = mockOrders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + Number(o.total), 0);
  return {
    products: mockProducts.length,
    customers: mockCustomers.length,
    orders: mockOrders.length,
    newInquiries: mockInquiries.filter((i) => i.status === "NEW").length,
    newMessages: mockContactMessages.filter((m) => m.status === "NEW").length,
    revenue: revenue.toFixed(2),
  };
}
