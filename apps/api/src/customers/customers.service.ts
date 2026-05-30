import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { toCsv } from '../common/csv.util';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
} from './dto/customer.dto';

export interface CustomerListQuery {
  q?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: string;
  pageSize?: string;
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(query: CustomerListQuery): Prisma.CustomerWhereInput {
    const where: Prisma.CustomerWhereInput = {};
    if (query.q) {
      where.OR = [
        { firstName: { contains: query.q, mode: 'insensitive' } },
        { lastName: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
        { company: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.createdFrom || query.createdTo) {
      where.createdAt = {};
      if (query.createdFrom) where.createdAt.gte = new Date(query.createdFrom);
      if (query.createdTo) where.createdAt.lte = new Date(query.createdTo);
    }
    return where;
  }

  async findAll(query: CustomerListQuery) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(query.pageSize ?? '20', 10) || 20),
    );

    const where = this.buildWhere(query);

    const [total, items] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { orders: true } } },
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  }

  async exportCsv(query: CustomerListQuery): Promise<string> {
    const where = this.buildWhere(query);
    const rows = await this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { orders: true } } },
    });
    return toCsv(rows, [
      { header: 'First Name', value: (c) => c.firstName },
      { header: 'Last Name', value: (c) => c.lastName },
      { header: 'Email', value: (c) => c.email },
      { header: 'Company', value: (c) => c.company },
      { header: 'Phone', value: (c) => c.phone },
      { header: 'Orders', value: (c) => c._count.orders },
      { header: 'Joined', value: (c) => c.createdAt },
    ]);
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: dto });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.customer.delete({ where: { id } });
    return { success: true };
  }
}
