import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  smtpUser?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  smtpPass?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  smtpFrom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notifyTo?: string;

  /** Public storefront origin for sitemap / feed URLs, e.g. https://easilybranded.com */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl({ protocols: ['https', 'http'], require_protocol: true, require_tld: false })
  siteUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(70)
  feedBrand?: string;
}

export class TestEmailDto {
  @ApiProperty()
  @IsEmail()
  to!: string;
}
