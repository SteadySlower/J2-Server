import { Module } from '@nestjs/common';
import { DictionaryApiController } from './dictionary-api.controller';
import { DictionaryApiService } from './dictionary-api.service';
import { DictionaryModule } from '../dictionary/dictionary.module';

@Module({
  imports: [DictionaryModule],
  controllers: [DictionaryApiController],
  providers: [DictionaryApiService],
})
export class DictionaryApiModule {}
