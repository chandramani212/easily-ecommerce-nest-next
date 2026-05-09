import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMediaDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  alt?: string;
}

export interface MediaListQuery {
  q?: string;
  page?: string;
  pageSize?: string;
}
