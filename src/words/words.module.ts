import { Module } from '@nestjs/common';
import { DictionaryModule } from '../dictionary/dictionary.module';
import { SyncModule } from '../sync/sync.module';
import { WordsController } from './words.controller';
import { WordsService } from './words.service';

@Module({
  imports: [DictionaryModule, SyncModule],
  controllers: [WordsController],
  providers: [WordsService],
})
export class WordsModule {}
