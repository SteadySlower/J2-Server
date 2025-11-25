import { Module } from '@nestjs/common';
import { DictionaryService } from './dictionary.service';
import { DictionaryCacheService } from './dictionary-cache.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../openAi/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [DictionaryService, DictionaryCacheService],
  exports: [DictionaryService],
})
export class DictionaryModule {}
