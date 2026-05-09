import {
  SupplierAuthType,
  SupplierImportFormat,
  SupplierKind,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/* ---- Supplier ---------------------------------------------------------- */

/**
 * Free-form per-authType credentials. We validate shape later (auth-adapters
 * throw on missing fields), keeping the API surface simple.
 */
export class SupplierAuthCredentialsDto {
  [key: string]: unknown;
}

export class CreateSupplierDto {
  @IsString() @MinLength(1) @MaxLength(120)
  name!: string;

  @IsEnum(SupplierKind)
  kind!: SupplierKind;

  @IsOptional() @IsString() @MaxLength(500)
  baseUrl?: string;

  @IsEnum(SupplierAuthType)
  authType!: SupplierAuthType;

  /** Plaintext credentials; encrypted server-side before persistence. */
  @IsOptional() @IsObject()
  authCredentials?: Record<string, unknown>;

  @IsOptional() @IsNumber() @Min(0) @Max(1000)
  defaultMarkupPct?: number;

  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;

  @IsOptional() @IsBoolean()
  active?: boolean;
}

export class UpdateSupplierDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120)
  name?: string;

  @IsOptional() @IsEnum(SupplierKind)
  kind?: SupplierKind;

  @IsOptional() @IsString() @MaxLength(500)
  baseUrl?: string;

  @IsOptional() @IsEnum(SupplierAuthType)
  authType?: SupplierAuthType;

  /**
   * If provided, replaces the encrypted secret entirely. Pass `null` to clear.
   * Omit to keep the existing secret untouched.
   */
  @IsOptional()
  authCredentials?: Record<string, unknown> | null;

  @IsOptional() @IsNumber() @Min(0) @Max(1000)
  defaultMarkupPct?: number;

  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;

  @IsOptional() @IsBoolean()
  active?: boolean;
}

/* ---- SupplierImport ---------------------------------------------------- */

export class CreateImportDto {
  @IsString() @MinLength(1) @MaxLength(160)
  name!: string;

  @IsEnum(SupplierImportFormat)
  format!: SupplierImportFormat;

  @IsOptional() @IsString() @MaxLength(500)
  endpoint?: string;

  @IsOptional() @IsString() @MaxLength(10)
  httpMethod?: string;

  @IsOptional() @IsObject()
  headers?: Record<string, string>;

  @IsOptional() @IsString()
  body?: string;

  @IsOptional() @IsString() @MaxLength(500)
  recordsPath?: string;

  @IsOptional() @IsObject()
  mapping?: Record<string, unknown>;

  @IsOptional() @IsObject()
  markup?: Record<string, unknown>;

  @IsOptional() @IsString() @MaxLength(120)
  cron?: string;

  @IsOptional() @IsBoolean()
  active?: boolean;

  @IsOptional() @IsBoolean()
  autoDeactivateMissing?: boolean;
}

export class UpdateImportDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(160)
  name?: string;

  @IsOptional() @IsEnum(SupplierImportFormat)
  format?: SupplierImportFormat;

  @IsOptional() @IsString() @MaxLength(500)
  endpoint?: string;

  @IsOptional() @IsString() @MaxLength(10)
  httpMethod?: string;

  @IsOptional() @IsObject()
  headers?: Record<string, string>;

  @IsOptional() @IsString()
  body?: string;

  @IsOptional() @IsString() @MaxLength(500)
  recordsPath?: string;

  @IsOptional() @IsObject()
  mapping?: Record<string, unknown>;

  @IsOptional() @IsObject()
  markup?: Record<string, unknown>;

  @IsOptional() @IsString() @MaxLength(120)
  cron?: string;

  @IsOptional() @IsBoolean()
  active?: boolean;

  @IsOptional() @IsBoolean()
  autoDeactivateMissing?: boolean;
}

/* ---- Run / dry-run query ----------------------------------------------- */

export class DryRunOptionsDto {
  @IsOptional() @IsInt() @Min(1) @Max(100)
  limit?: number;
}

export class RunNowOptionsDto {
  @IsOptional() @IsInt() @Min(1)
  limit?: number;
}

/* ---- Test connection --------------------------------------------------- */

export class TestConnectionDto {
  @IsOptional() @IsString() @MaxLength(500)
  endpoint?: string;

  @IsOptional() @IsString() @MaxLength(10)
  httpMethod?: string;
}

/* ---- Inline test sample (optional helper for the wizard). -------------- */

export class SampleFromUrlDto {
  @IsString()
  url!: string;
}

/* ---- Listing query ----------------------------------------------------- */

export class SupplierListQuery {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsBoolean() @Type(() => Boolean)
  active?: boolean;
}

export class SupplierProductsQuery {
  @IsOptional() @IsInt() @Type(() => Number)
  take?: number;

  @IsOptional() @IsInt() @Type(() => Number)
  skip?: number;
}

export class RunsListQuery {
  @IsOptional() @IsInt() @Type(() => Number)
  take?: number;

  @IsOptional() @IsInt() @Type(() => Number)
  skip?: number;
}

export class CronPreviewDto {
  @IsString()
  expression!: string;

  @IsOptional() @IsInt() @Min(1) @Max(20)
  count?: number;
}

/* ---- Re-exports for convenience ---------------------------------------- */

export { ValidateNested, Type };
