import { SupplierOrigin } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/* ---- Supplier (the real-world company) --------------------------------- */

/**
 * Contact fields shared by create/update. Phones/website are free-form strings
 * (kept lenient on purpose — international formats, extensions, etc.).
 */
export class CreateSupplierDto {
  @IsString() @MinLength(1) @MaxLength(160)
  name!: string;

  /** The Source this supplier belongs to. */
  @IsString() @MinLength(1)
  sourceId!: string;

  @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  @IsOptional() @IsString() @MaxLength(40)
  altPhone?: string;

  @IsOptional() @IsString() @MaxLength(40)
  tollFree?: string;

  @IsOptional() @IsString() @MaxLength(300)
  website?: string;

  @IsOptional() @IsBoolean()
  active?: boolean;
}

export class UpdateSupplierDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(160)
  name?: string;

  @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  @IsOptional() @IsString() @MaxLength(40)
  altPhone?: string;

  @IsOptional() @IsString() @MaxLength(40)
  tollFree?: string;

  @IsOptional() @IsString() @MaxLength(300)
  website?: string;

  @IsOptional() @IsBoolean()
  active?: boolean;
}

/**
 * Upsert payload for a direct source's single manual supplier. Used by the
 * Source edit form; the sourceId comes from the route, origin is forced MANUAL.
 */
export class UpsertManualSupplierDto {
  @IsString() @MinLength(1) @MaxLength(160)
  name!: string;

  @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  @IsOptional() @IsString() @MaxLength(40)
  altPhone?: string;

  @IsOptional() @IsString() @MaxLength(40)
  tollFree?: string;

  @IsOptional() @IsString() @MaxLength(300)
  website?: string;
}

export class SupplierListQuery {
  @IsOptional() @IsString()
  search?: string;

  /** Filter to suppliers under one source. */
  @IsOptional() @IsString()
  sourceId?: string;

  @IsOptional() @IsEnum(SupplierOrigin)
  origin?: SupplierOrigin;

  @IsOptional() @IsBoolean() @Type(() => Boolean)
  active?: boolean;

  @IsOptional() @IsInt() @Type(() => Number)
  take?: number;

  @IsOptional() @IsInt() @Type(() => Number)
  skip?: number;
}

export class SupplierProductsQuery {
  @IsOptional() @IsInt() @Type(() => Number)
  take?: number;

  @IsOptional() @IsInt() @Type(() => Number)
  skip?: number;
}
