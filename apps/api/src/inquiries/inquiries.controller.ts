import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { Public } from '../auth/decorators/public.decorator';
import {
  CreateInquiryDto,
  UpdateInquiryStatusDto,
} from './dto/inquiry.dto';
import { InquiriesService, InquiryListQuery } from './inquiries.service';

@ApiTags('inquiries')
@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateInquiryDto) {
    return this.inquiries.create(dto);
  }

  @ApiBearerAuth()
  @Get()
  findAll(@Query() query: InquiryListQuery) {
    return this.inquiries.findAll(query);
  }

  @ApiBearerAuth()
  @Get('export')
  async export(
    @Query() query: InquiryListQuery,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.inquiries.exportCsv(query);
    const date = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="inquiries-${date}.csv"`,
    });
    res.send(csv);
  }

  @ApiBearerAuth()
  @Get('report/source')
  sourceReport(@Query('from') from?: string, @Query('to') to?: string) {
    return this.inquiries.sourceReport({ from, to });
  }

  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inquiries.findOne(id);
  }

  @ApiBearerAuth()
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInquiryStatusDto) {
    return this.inquiries.updateStatus(id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inquiries.remove(id);
  }
}
