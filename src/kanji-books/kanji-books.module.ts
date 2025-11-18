import { Module } from '@nestjs/common';
import { KanjiBooksController } from './kanji-books.controller';
import { KanjiBooksService } from './kanji-books.service';

@Module({
  controllers: [KanjiBooksController],
  providers: [KanjiBooksService],
})
export class KanjiBooksModule {}
