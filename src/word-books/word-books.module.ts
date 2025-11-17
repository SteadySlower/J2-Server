import { Module } from '@nestjs/common';
import { WordBooksController } from './word-books.controller';
import { WordBooksService } from './word-books.service';

@Module({
  controllers: [WordBooksController],
  providers: [WordBooksService],
})
export class WordBooksModule {}
