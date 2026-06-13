import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Update payload for an editable page. `content` is a slug-specific JSON blob
 * (validated only as an object here — the admin editor owns its shape); the
 * rest are SEO fields.
 */
export class UpdatePageDto {
  @IsOptional() @IsString() @MaxLength(160)
  title?: string;

  @IsOptional() @IsObject()
  content?: Record<string, unknown>;

  @IsOptional() @IsString() @MaxLength(200)
  metaTitle?: string;

  @IsOptional() @IsString() @MaxLength(400)
  metaDescription?: string;

  @IsOptional() @IsString() @MaxLength(500)
  ogImage?: string;

  @IsOptional() @IsString() @MaxLength(400)
  keywords?: string;

  @IsOptional() @IsString() @MaxLength(500)
  canonicalUrl?: string;
}
