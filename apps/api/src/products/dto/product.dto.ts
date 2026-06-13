import { ApiProperty } from '@nestjs/swagger';
import { TierPriceType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class TierPriceDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  minQuantity!: number;

  @ApiProperty({
    enum: TierPriceType,
    required: false,
    default: TierPriceType.FIXED,
  })
  @IsOptional()
  @IsEnum(TierPriceType)
  type?: TierPriceType;

  @ApiProperty({
    description:
      'FIXED: per-unit price in store currency. PERCENTAGE: 0-100 off Selling Price.',
  })
  @IsNumber()
  @Min(0)
  @ValidateIf((o: TierPriceDto) => o.type === TierPriceType.PERCENTAGE)
  @Max(100)
  price!: number;
}

export class ProductAttributeDto {
  @ApiProperty()
  @IsString()
  @MaxLength(80)
  name!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  value!: string;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiProperty()
  @IsString()
  sku!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  basePrice!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  sellingPrice!: number;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  relatedProductIds?: string[];

  @ApiProperty({ type: [ProductAttributeDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  attributes?: ProductAttributeDto[];

  @ApiProperty({ type: [TierPriceDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TierPriceDto)
  tierPrices?: TierPriceDto[];

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(200)
  metaTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(400)
  metaDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(500)
  ogImage?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(400)
  keywords?: string;
}

export class UpdateProductDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  relatedProductIds?: string[];

  @ApiProperty({ type: [ProductAttributeDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  attributes?: ProductAttributeDto[];

  @ApiProperty({ type: [TierPriceDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TierPriceDto)
  tierPrices?: TierPriceDto[];

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(200)
  metaTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(400)
  metaDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(500)
  ogImage?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(400)
  keywords?: string;
}
