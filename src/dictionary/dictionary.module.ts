import { Module } from '@nestjs/common';
import { DictionaryService } from './dictionary.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../openAi/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [DictionaryService],
  exports: [DictionaryService],
})
export class DictionaryModule {}
