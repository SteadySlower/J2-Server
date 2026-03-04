import { Module } from '@nestjs/common';
import { SyncModule } from '../sync/sync.module';
import { KanjiBooksController } from './kanji-books.controller';
import { KanjiBooksService } from './kanji-books.service';

@Module({
  imports: [SyncModule],
  controllers: [KanjiBooksController],
  providers: [KanjiBooksService],
})
export class KanjiBooksModule {}
