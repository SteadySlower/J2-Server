import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateKanjiDto } from './dto/create-kanji.dto';
import { KanjisService } from './kanjis.service';

@Controller('kanjis')
@UseGuards(AuthGuard)
export class KanjisController {
  constructor(private readonly kanjisService: KanjisService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createKanjiDto: CreateKanjiDto,
  ) {
    return this.kanjisService.create(user.id, createKanjiDto);
  }
}
