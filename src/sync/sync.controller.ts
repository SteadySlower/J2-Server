import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { PullQueryDto } from './dto/pull-query.dto';
import { PushDto } from './dto/push.dto';
import { SyncService } from './sync.service';

@Controller('sync')
@UseGuards(AuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  pull(@CurrentUser() user: CurrentUserPayload, @Query() query: PullQueryDto) {
    return this.syncService.pull(
      user.id,
      query.since,
      query.limit,
      query.cursor,
    );
  }

  @Post('push')
  push(@CurrentUser() user: CurrentUserPayload, @Body() body: PushDto) {
    return this.syncService.push(user.id, body);
  }
}
