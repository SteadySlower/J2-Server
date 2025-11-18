import { Module } from '@nestjs/common';
import { KanjisController } from './kanjis.controller';
import { KanjisService } from './kanjis.service';

@Module({
  controllers: [KanjisController],
  providers: [KanjisService],
})
export class KanjisModule {}
