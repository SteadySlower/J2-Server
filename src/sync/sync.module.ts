import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SyncController } from './sync.controller';
import { SyncDeletionService } from './sync-deletion.service';
import { SyncPushHandlersService } from './sync-push-handlers.service';
import { SyncService } from './sync.service';

@Module({
  imports: [PrismaModule],
  controllers: [SyncController],
  providers: [SyncDeletionService, SyncPushHandlersService, SyncService],
  exports: [SyncDeletionService],
})
export class SyncModule {}
