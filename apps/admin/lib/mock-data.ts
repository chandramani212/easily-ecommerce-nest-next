import type {
  AdminUser,
  Category,
  ContactMessage,
  Customer,
  Inquiry,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Settings,
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

export const mockProducts: Product[] = [
  {
    id: "prod-tee-classic",
    name: "Classic Cotton Tee",
    slug: "classic-cotton-tee",
    sku: "APP-TEE-001",
    description:
      "Our bestselling 100% ringspun cotton tee. Soft-washed for an instantly broken-in feel.",
    basePrice: "12.99",
    images: [],
    active: true,
    categoryId: "cat-apparel",
    category: categoryById("cat-apparel"),
    tierPrices: [
      { id: "tp-1", minQuantity: 25, price: "11.49" },
      { id: "tp-2", minQuantity: 100, price: "9.99" },
      { id: "tp-3", minQuantity: 500, price: "7.99" },
    ],
    createdAt: daysAgo(60),
    updatedAt: daysAgo(3),
  },
  {
    id: "prod-hoodie",
    name: "Premium Pullover Hoodie",
    slug: "premium-hoodie",
    sku: "APP-HOOD-010",
    description:
      "Heavyweight 380gsm fleece with double-layer hood and kangaroo pocket.",
    basePrice: "34.50",
    images: [],
    active: true,
    categoryId: "cat-apparel",
    category: categoryById("cat-apparel"),
    tierPrices: [
      { id: "tp-4", minQuantity: 24, price: "31.00" },
      { id: "tp-5", minQuantity: 100, price: "27.50" },
    ],
    createdAt: daysAgo(55),
    updatedAt: daysAgo(12),
  },
  {
    id: "prod-polo",
    name: "Embroidered Performance Polo",
    slug: "embroidered-polo",
    sku: "APP-POLO-022",
    description: "Moisture-wicking piqué polo, ready for corporate events.",
    basePrice: "22.00",
    images: [],
    active: true,
    categoryId: "cat-apparel",
    category: categoryById("cat-apparel"),
    tierPrices: [{ id: "tp-6", minQuantity: 50, price: "18.75" }],
    createdAt: daysAgo(40),
    updatedAt: daysAgo(2),
  },
  {
    id: "prod-cap",
    name: "Structured 6-Panel Cap",
    slug: "structured-cap",
    sku: "APP-CAP-004",
    description: "Mid-profile cap with structured front and adjustable strap.",
    basePrice: "9.50",
    images: [],
    active: false,
    categoryId: "cat-apparel",
    category: categoryById("cat-apparel"),
    tierPrices: [],
    createdAt: daysAgo(35),
    updatedAt: daysAgo(30),
  },
  {
    id: "prod-mug",
    name: "Ceramic Coffee Mug 11oz",
    slug: "coffee-mug",
    sku: "DRK-MUG-001",
    description: "Dishwasher-safe white ceramic mug with full-color wrap.",
    basePrice: "6.25",
    images: [],
    active: true,
    categoryId: "cat-drinkware",
    category: categoryById("cat-drinkware"),
    tierPrices: [
      { id: "tp-7", minQuantity: 36, price: "5.50" },
      { id: "tp-8", minQuantity: 144, price: "4.25" },
    ],
    createdAt: daysAgo(75),
    updatedAt: daysAgo(5),
  },
  {
    id: "prod-bottle",
    name: "Insulated Water Bottle 20oz",
    slug: "water-bottle",
    sku: "DRK-BOT-002",
    description: "Double-wall vacuum insulated; keeps cold 24h, hot 12h.",
    basePrice: "18.00",
    images: [],
    active: true,
    categoryId: "cat-drinkware",
    category: categoryById("cat-drinkware"),
    tierPrices: [{ id: "tp-9", minQuantity: 48, price: "15.00" }],
    createdAt: daysAgo(50),
    updatedAt: daysAgo(8),
  },
  {
    id: "prod-tumbler",
    name: "Copper-Lined Tumbler 16oz",
    slug: "copper-tumbler",
    sku: "DRK-TUM-007",
    description: "Matte powder-coated tumbler with laser engraving area.",
    basePrice: "24.00",
    images: [],
    active: true,
    categoryId: "cat-drinkware",
    category: categoryById("cat-drinkware"),
    tierPrices: [
      { id: "tp-10", minQuantity: 50, price: "21.00" },
      { id: "tp-11", minQuantity: 200, price: "18.50" },
    ],
    createdAt: daysAgo(28),
    updatedAt: daysAgo(1),
  },
  {
    id: "prod-notebook",
    name: "Hardcover Notebook A5",
    slug: "hardcover-notebook",
    sku: "STA-NB-001",
    description: "160 page dot-grid notebook with elastic closure and ribbon.",
    basePrice: "8.75",
    images: [],
    active: true,
    categoryId: "cat-stationery",
    category: categoryById("cat-stationery"),
    tierPrices: [{ id: "tp-12", minQuantity: 25, price: "7.50" }],
    createdAt: daysAgo(85),
    updatedAt: daysAgo(15),
  },
  {
    id: "prod-pen",
    name: "Metal Click Pen",
    slug: "metal-click-pen",
    sku: "STA-PEN-003",
    description: "Brushed aluminum click pen, blue ink, smooth writing.",
    basePrice: "3.20",
    images: [],
    active: true,
    categoryId: "cat-stationery",
    category: categoryById("cat-stationery"),
    tierPrices: [
      { id: "tp-13", minQuantity: 100, price: "2.75" },
      { id: "tp-14", minQuantity: 500, price: "2.10" },
    ],
    createdAt: daysAgo(70),
    updatedAt: daysAgo(9),
  },
  {
    id: "prod-sticker",
    name: "Die-Cut Sticker Pack",
    slug: "sticker-pack",
    sku: "STA-STK-012",
    description: "Weatherproof vinyl stickers, custom shapes up to 4 inches.",
    basePrice: "2.00",
    images: [],
    active: false,
    categoryId: "cat-stationery",
    category: categoryById("cat-stationery"),
    tierPrices: [],
    createdAt: daysAgo(22),
    updatedAt: daysAgo(22),
  },
  {
    id: "prod-tote",
    name: "Heavyweight Canvas Tote",
    slug: "canvas-tote",
    sku: "BAG-TOT-001",
    description: "12oz natural canvas tote with reinforced shoulder straps.",
    basePrice: "9.80",
    images: [],
    active: true,
    categoryId: "cat-bags",
    category: categoryById("cat-bags"),
    tierPrices: [{ id: "tp-15", minQuantity: 100, price: "7.40" }],
    createdAt: daysAgo(45),
    updatedAt: daysAgo(4),
  },
  {
    id: "prod-backpack",
    name: "Urban Commuter Backpack",
    slug: "commuter-backpack",
    sku: "BAG-BP-002",
    description: "Water-resistant backpack with laptop sleeve and USB passthrough.",
    basePrice: "48.00",
    images: [],
    active: true,
    categoryId: "cat-bags",
    category: categoryById("cat-bags"),
    tierPrices: [{ id: "tp-16", minQuantity: 25, price: "42.00" }],
    createdAt: daysAgo(20),
    updatedAt: daysAgo(6),
  },
  {
    id: "prod-powerbank",
    name: "10,000mAh Power Bank",
    slug: "power-bank",
    sku: "TEC-PB-001",
    description: "Slim aluminum power bank with dual USB-C output.",
    basePrice: "26.00",
    images: [],
    active: true,
    categoryId: "cat-tech",
    category: categoryById("cat-tech"),
    tierPrices: [{ id: "tp-17", minQuantity: 50, price: "22.00" }],
    createdAt: daysAgo(18),
    updatedAt: daysAgo(2),
  },
  {
    id: "prod-mousepad",
    name: "Custom Desk Mousepad XL",
    slug: "desk-mousepad",
    sku: "TEC-MP-004",
    description: "Full-size desk mat with stitched edges, 900x400mm.",
    basePrice: "19.50",
    images: [],
    active: true,
    categoryId: "cat-tech",
    category: categoryById("cat-tech"),
    tierPrices: [{ id: "tp-18", minQuantity: 50, price: "16.00" }],
    createdAt: daysAgo(12),
    updatedAt: daysAgo(1),
  },
];

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
  smtpFrom: "no-reply@shopease.demo",
  smtpSecure: false,
  notifyTo: "hello@shopease.demo",
};

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
