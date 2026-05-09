import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';

import {
  CurrentUser,
  JwtUser,
} from '../auth/decorators/current-user.decorator';
import { MediaListQuery, UpdateMediaDto } from './dto/media.dto';
import { MediaService } from './media.service';

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  findAll(@Query() query: MediaListQuery) {
    return this.media.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.media.findOne(id);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtUser,
  ) {
    return this.media.upload(file, user?.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    return this.media.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.media.remove(id);
  }
}
