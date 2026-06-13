import { ApiProperty } from '@nestjs/swagger';
import { InquiryStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInquiryDto {
  @ApiProperty()
  @IsString()
  inquiryType!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  productSku?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(1000)
  productImage?: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  quantity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;

  /* ---- Lead-source attribution (captured silently by the web form). ---- */

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  utmSource?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  utmMedium?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  utmCampaign?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  referrer?: string;
}

export class UpdateInquiryStatusDto {
  @ApiProperty({ enum: InquiryStatus })
  @IsEnum(InquiryStatus)
  status!: InquiryStatus;
}
