import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateKanjiBookDto } from './dto/create-kanji-book.dto';
import { UpdateKanjiBookDto } from './dto/update-kanji-book.dto';
import { MoveKanjisDto } from './dto/move-kanjis.dto';
import { FindKanjisQueryDto } from './dto/find-kanjis-query.dto';
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
    @Query() query: FindKanjisQueryDto,
  ) {
    return this.kanjiBooksService.findOne(id, user.id, query.status);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createKanjiBookDto: CreateKanjiBookDto,
  ) {
    return this.kanjiBooksService.create(user.id, createKanjiBookDto);
  }

  @Post(':sourceBookId/move-kanjis')
  moveKanjis(
    @Param('sourceBookId', ParseUUIDPipe) sourceBookId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() moveKanjisDto: MoveKanjisDto,
  ) {
    return this.kanjiBooksService.moveKanjis(
      sourceBookId,
      user.id,
      moveKanjisDto,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateKanjiBookDto: UpdateKanjiBookDto,
  ) {
    return this.kanjiBooksService.update(id, user.id, updateKanjiBookDto);
  }

  @Delete(':bookId/kanjis/:kanjiId')
  removeKanjiFromBook(
    @Param('bookId', ParseUUIDPipe) bookId: string,
    @Param('kanjiId', ParseUUIDPipe) kanjiId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.kanjiBooksService.removeKanjiFromBook(bookId, kanjiId, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.kanjiBooksService.remove(id, user.id);
  }
}
