import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [
      productCount,
      customerCount,
      orderCount,
      newInquiries,
      newMessages,
      revenueAgg,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.customer.count(),
      this.prisma.order.count(),
      this.prisma.inquiry.count({ where: { status: 'NEW' } }),
      this.prisma.contactMessage.count({ where: { status: 'NEW' } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: 'CANCELLED' } },
      }),
    ]);

    return {
      products: productCount,
      customers: customerCount,
      orders: orderCount,
      newInquiries,
      newMessages,
      revenue: revenueAgg._sum.total ?? 0,
    };
  }
}
