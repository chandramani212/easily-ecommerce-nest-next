import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Only a SUPER_ADMIN may see or manage SUPER_ADMIN accounts. For everyone
   * else those users are hidden entirely (filtered from lists, 404 by id) so
   * the role isn't discoverable from the admin panel.
   */
  private canManageSuperAdmins(viewerRole: UserRole): boolean {
    return viewerRole === 'SUPER_ADMIN';
  }

  findAll(viewerRole: UserRole) {
    return this.prisma.user.findMany({
      where: this.canManageSuperAdmins(viewerRole)
        ? undefined
        : { role: { not: 'SUPER_ADMIN' } },
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, viewerRole: UserRole) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'SUPER_ADMIN' && !this.canManageSuperAdmins(viewerRole)) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(dto: CreateUserDto, viewerRole: UserRole) {
    if (dto.role === 'SUPER_ADMIN' && !this.canManageSuperAdmins(viewerRole)) {
      throw new ForbiddenException('Cannot create a super admin');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        passwordHash,
        role: dto.role ?? 'STAFF',
      },
      select: userSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto, viewerRole: UserRole) {
    // Throws 404 when the target is a super admin the viewer may not manage.
    await this.findOne(id, viewerRole);
    if (dto.role === 'SUPER_ADMIN' && !this.canManageSuperAdmins(viewerRole)) {
      throw new ForbiddenException('Cannot assign the super admin role');
    }

    const data: Record<string, unknown> = {};
    if (dto.email) data.email = dto.email.toLowerCase();
    if (dto.name) data.name = dto.name;
    if (dto.role) data.role = dto.role;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  }

  async remove(id: string, viewerRole: UserRole) {
    await this.findOne(id, viewerRole);
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
