import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import {
  ContactListQuery,
  ContactMessagesService,
} from './contact-messages.service';
import {
  CreateContactMessageDto,
  UpdateContactMessageStatusDto,
} from './dto/contact-message.dto';

@ApiTags('contact-messages')
@Controller('contact-messages')
export class ContactMessagesController {
  constructor(private readonly messages: ContactMessagesService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateContactMessageDto) {
    return this.messages.create(dto);
  }

  @ApiBearerAuth()
  @Get()
  findAll(@Query() query: ContactListQuery) {
    return this.messages.findAll(query);
  }

  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messages.findOne(id);
  }

  @ApiBearerAuth()
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContactMessageStatusDto,
  ) {
    return this.messages.updateStatus(id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messages.remove(id);
  }
}
