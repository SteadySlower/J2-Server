import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateWordBookDto } from './dto/create-word-book.dto';
import { WordBooksService } from './word-books.service';

@Controller('word-books')
@UseGuards(AuthGuard)
export class WordBooksController {
  constructor(private readonly wordBooksService: WordBooksService) {}

  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.wordBooksService.findAll(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createWordBookDto: CreateWordBookDto,
  ) {
    return this.wordBooksService.create(user.id, createWordBookDto);
  }
}
