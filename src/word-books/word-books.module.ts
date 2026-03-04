import { Module } from '@nestjs/common';
import { SyncModule } from '../sync/sync.module';
import { WordBooksController } from './word-books.controller';
import { WordBooksService } from './word-books.service';

@Module({
  imports: [SyncModule],
  controllers: [WordBooksController],
  providers: [WordBooksService],
})
export class WordBooksModule {}
