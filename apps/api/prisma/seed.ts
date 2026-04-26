import { PrismaClient, UserRole, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@shopease.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Store Admin',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });
  console.log(`Admin user: ${admin.email}`);

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      smtpFrom: 'no-reply@shopease.local',
      smtpSecure: false,
      notifyTo: adminEmail,
    },
  });

  const catTees = await prisma.category.upsert({
    where: { slug: 't-shirts' },
    update: {},
    create: { name: 'T-Shirts', slug: 't-shirts' },
  });
  const catStationery = await prisma.category.upsert({
    where: { slug: 'stationery' },
    update: {},
    create: { name: 'Stationery', slug: 'stationery' },
  });
  const catBags = await prisma.category.upsert({
    where: { slug: 'bags' },
    update: {},
    create: { name: 'Bags', slug: 'bags' },
  });

  const products = [
    {
      name: 'Classic Cotton T-Shirt',
      slug: 'classic-cotton-t-shirt',
      sku: 'TS-CLASSIC-001',
      description: 'Premium 100% cotton t-shirt, custom printed.',
      basePrice: 9.99,
      categoryId: catTees.id,
      tiers: [
        { minQuantity: 50, price: 8.5 },
        { minQuantity: 100, price: 7.25 },
        { minQuantity: 250, price: 6.0 },
      ],
    },
    {
      name: 'Premium Polo Shirt',
      slug: 'premium-polo-shirt',
      sku: 'TS-POLO-002',
      description: 'Professional polo with embroidered logo.',
      basePrice: 14.99,
      categoryId: catTees.id,
      tiers: [
        { minQuantity: 25, price: 13.0 },
        { minQuantity: 100, price: 11.0 },
      ],
    },
    {
      name: 'Branded Notebook',
      slug: 'branded-notebook',
      sku: 'ST-NB-001',
      description: 'Hardcover A5 notebook with custom branding.',
      basePrice: 4.5,
      categoryId: catStationery.id,
      tiers: [
        { minQuantity: 100, price: 3.75 },
        { minQuantity: 500, price: 2.95 },
      ],
    },
    {
      name: 'Custom Ballpoint Pen',
      slug: 'custom-ballpoint-pen',
      sku: 'ST-PEN-001',
      description: 'Smooth-writing pen with laser-engraved logo.',
      basePrice: 1.25,
      categoryId: catStationery.id,
      tiers: [
        { minQuantity: 250, price: 0.95 },
        { minQuantity: 1000, price: 0.65 },
      ],
    },
    {
      name: 'Canvas Tote Bag',
      slug: 'canvas-tote-bag',
      sku: 'BG-TOTE-001',
      description: 'Eco-friendly canvas tote, perfect for events.',
      basePrice: 5.5,
      categoryId: catBags.id,
      tiers: [
        { minQuantity: 100, price: 4.5 },
        { minQuantity: 500, price: 3.25 },
      ],
    },
  ];

  for (const p of products) {
    const { tiers, ...data } = p;
    const product = await prisma.product.upsert({
      where: { sku: data.sku },
      update: {},
      create: {
        ...data,
        tierPrices: {
          create: tiers,
        },
      },
    });
    console.log(`Product: ${product.name}`);
  }

  const customer = await prisma.customer.upsert({
    where: { email: 'jane@acme.com' },
    update: {},
    create: {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@acme.com',
      phone: '555-0100',
      company: 'Acme Corp',
    },
  });

  const firstProduct = await prisma.product.findFirst({
    where: { sku: 'TS-CLASSIC-001' },
  });

  if (firstProduct) {
    const existingOrder = await prisma.order.findFirst({
      where: { orderNumber: 'ORD-1001' },
    });
    if (!existingOrder) {
      await prisma.order.create({
        data: {
          orderNumber: 'ORD-1001',
          customerId: customer.id,
          status: OrderStatus.PROCESSING,
          subtotal: 850,
          shipping: 25,
          tax: 0,
          total: 875,
          shippingAddress: {
            line1: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            zip: '62701',
            country: 'USA',
          },
          items: {
            create: [
              {
                productId: firstProduct.id,
                name: firstProduct.name,
                quantity: 100,
                unitPrice: 8.5,
                lineTotal: 850,
              },
            ],
          },
        },
      });
      console.log('Sample order ORD-1001 created');
    }
  }

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
