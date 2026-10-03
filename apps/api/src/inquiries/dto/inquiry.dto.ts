import { ApiProperty } from '@nestjs/swagger';
import { InquiryStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateInquiryDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  inquiryType!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  productName?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  @MaxLength(100)
  productSku?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(1000)
  productImage?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  company?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  quantity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  message?: string;

  /* ---- Lead-source attribution (captured silently by the web form). ---- */

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  @MaxLength(200)
  utmSource?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  @MaxLength(200)
  utmMedium?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  @MaxLength(200)
  utmCampaign?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  @MaxLength(1000)
  referrer?: string;

  /** Honeypot — hidden from real users; any value marks the submission as a bot. */
  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(200)
  website?: string;
}

export class UpdateInquiryStatusDto {
  @ApiProperty({ enum: InquiryStatus })
  @IsEnum(InquiryStatus)
  status!: InquiryStatus;
}
