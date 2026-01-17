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
import { CreateWordBookDto } from './dto/create-word-book.dto';
import { UpdateWordBookDto } from './dto/update-word-book.dto';
import { MoveWordsDto } from './dto/move-words.dto';
import { WordBooksService } from './word-books.service';

@Controller('word-books')
@UseGuards(AuthGuard)
export class WordBooksController {
  constructor(private readonly wordBooksService: WordBooksService) {}

  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.wordBooksService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.wordBooksService.findOne(id, user.id);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createWordBookDto: CreateWordBookDto,
  ) {
    return this.wordBooksService.create(user.id, createWordBookDto);
  }

  @Post(':sourceBookId/move-words')
  moveWords(
    @Param('sourceBookId', ParseUUIDPipe) sourceBookId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() moveWordsDto: MoveWordsDto,
  ) {
    return this.wordBooksService.moveWords(sourceBookId, user.id, moveWordsDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateWordBookDto: UpdateWordBookDto,
  ) {
    return this.wordBooksService.update(id, user.id, updateWordBookDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.wordBooksService.remove(id, user.id);
  }
}
