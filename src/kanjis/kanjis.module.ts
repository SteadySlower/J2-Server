import { Module } from '@nestjs/common';
import { SyncModule } from '../sync/sync.module';
import { KanjisController } from './kanjis.controller';
import { KanjisService } from './kanjis.service';

@Module({
  imports: [SyncModule],
  controllers: [KanjisController],
  providers: [KanjisService],
})
export class KanjisModule {}
