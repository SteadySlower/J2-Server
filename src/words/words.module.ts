import { Module } from '@nestjs/common';
import { WordsController } from './words.controller';
import { WordsService } from './words.service';
import { DictionaryModule } from '../dictionary/dictionary.module';

@Module({
  imports: [DictionaryModule],
  controllers: [WordsController],
  providers: [WordsService],
})
export class WordsModule {}
