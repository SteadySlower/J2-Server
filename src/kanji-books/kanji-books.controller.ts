import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateKanjiBookDto } from './dto/create-kanji-book.dto';
import { KanjiBooksService } from './kanji-books.service';

@Controller('kanji-books')
@UseGuards(AuthGuard)
export class KanjiBooksController {
  constructor(private readonly kanjiBooksService: KanjiBooksService) {}

  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.kanjiBooksService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.kanjiBooksService.findOne(id, user.id);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createKanjiBookDto: CreateKanjiBookDto,
  ) {
    return this.kanjiBooksService.create(user.id, createKanjiBookDto);
  }
}
