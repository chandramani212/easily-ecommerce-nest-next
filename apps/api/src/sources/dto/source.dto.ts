import {
  SourceAuthType,
  SourceImportFormat,
  SourceKind,
} from '@prisma/client';
import {
  IsArray,
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

/* ---- Source ---------------------------------------------------------- */

/**
 * Free-form per-authType credentials. We validate shape later (auth-adapters
 * throw on missing fields), keeping the API surface simple.
 */
export class SourceAuthCredentialsDto {
  [key: string]: unknown;
}

export class CreateSourceDto {
  @IsString() @MinLength(1) @MaxLength(120)
  name!: string;

  @IsEnum(SourceKind)
  kind!: SourceKind;

  @IsOptional() @IsString() @MaxLength(500)
  baseUrl?: string;

  @IsEnum(SourceAuthType)
  authType!: SourceAuthType;

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

export class UpdateSourceDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120)
  name?: string;

  @IsOptional() @IsEnum(SourceKind)
  kind?: SourceKind;

  @IsOptional() @IsString() @MaxLength(500)
  baseUrl?: string;

  @IsOptional() @IsEnum(SourceAuthType)
  authType?: SourceAuthType;

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

/* ---- SourceImport ---------------------------------------------------- */

export class CreateImportDto {
  @IsString() @MinLength(1) @MaxLength(160)
  name!: string;

  @IsEnum(SourceImportFormat)
  format!: SourceImportFormat;

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

  @IsOptional() @IsEnum(SourceImportFormat)
  format?: SourceImportFormat;

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

  /** ASI only: scope the run to these supplier externalIds (asi numbers). */
  @IsOptional() @IsArray() @IsString({ each: true })
  supplierExternalIds?: string[];
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

export class SourceListQuery {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsBoolean() @Type(() => Boolean)
  active?: boolean;

  @IsOptional() @IsInt() @Type(() => Number)
  take?: number;

  @IsOptional() @IsInt() @Type(() => Number)
  skip?: number;
}

export class SourceProductsQuery {
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
