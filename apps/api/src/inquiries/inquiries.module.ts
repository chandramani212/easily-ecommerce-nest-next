import { Module } from '@nestjs/common';

import { InquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';
import { LeadSourcesController } from './lead-sources.controller';
import { LeadSourcesService } from './lead-sources.service';

@Module({
  controllers: [InquiriesController, LeadSourcesController],
  providers: [InquiriesService, LeadSourcesService],
  exports: [InquiriesService],
})
export class InquiriesModule {}
