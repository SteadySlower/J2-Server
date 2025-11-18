import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateKanjiDto } from './dto/create-kanji.dto';
import { UpdateKanjiDto } from './dto/update-kanji.dto';
import { KanjisService } from './kanjis.service';

@Controller('kanjis')
@UseGuards(AuthGuard)
export class KanjisController {
  constructor(private readonly kanjisService: KanjisService) {}

  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.kanjisService.findAll(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createKanjiDto: CreateKanjiDto,
  ) {
    return this.kanjisService.create(user.id, createKanjiDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateKanjiDto: UpdateKanjiDto,
  ) {
    return this.kanjisService.update(id, user.id, updateKanjiDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.kanjisService.remove(id, user.id);
  }
}
