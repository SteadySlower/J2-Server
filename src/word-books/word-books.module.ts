import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WordBooksController } from './word-books.controller';
import { WordBooksService } from './word-books.service';

@Module({
  controllers: [WordBooksController],
  providers: [WordBooksService, PrismaService],
})
export class WordBooksModule {}
