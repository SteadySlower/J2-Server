import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SyncController } from './sync.controller';
import { SyncDeletionService } from './sync-deletion.service';
import { SyncService } from './sync.service';

@Module({
  imports: [PrismaModule],
  controllers: [SyncController],
  providers: [SyncDeletionService, SyncService],
  exports: [SyncDeletionService],
})
export class SyncModule {}
