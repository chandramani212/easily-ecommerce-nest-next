import { ApiProperty } from '@nestjs/swagger';
import { ContactStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContactMessageDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  message!: string;

  /** Honeypot — hidden from real users; any value marks the submission as a bot. */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

export class UpdateContactMessageStatusDto {
  @ApiProperty({ enum: ContactStatus })
  @IsEnum(ContactStatus)
  status!: ContactStatus;
}
