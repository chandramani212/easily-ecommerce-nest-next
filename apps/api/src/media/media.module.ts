import { Module } from '@nestjs/common';

import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { LocalStorageAdapter } from './storage/local-storage.adapter';
import { STORAGE_ADAPTER } from './storage/storage-adapter';

@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    LocalStorageAdapter,
    {
      provide: STORAGE_ADAPTER,
      useExisting: LocalStorageAdapter,
    },
  ],
  exports: [MediaService],
})
export class MediaModule {}
