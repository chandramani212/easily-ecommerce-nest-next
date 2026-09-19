import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateLeadSourceDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label!: string;

  /** Optional; derived from the label when omitted. Stored on each lead. */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'key may only contain a-z, 0-9 and hyphens' })
  key?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  organic?: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hosts?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  utmSources?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  utmMediums?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(899)
  priority?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateLeadSourceDto extends PartialType(CreateLeadSourceDto) {}
