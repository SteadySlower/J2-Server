import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ScheduleDto } from './dto/schedule.dto';
import { SchedulesService } from './schedules.service';

@Controller('schedules')
@UseGuards(AuthGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  upsert(
    @CurrentUser() user: CurrentUserPayload,
    @Body() scheduleDto: ScheduleDto,
  ) {
    return this.schedulesService.upsert(user.id, scheduleDto);
  }

  @Get()
  findOne(@CurrentUser() user: CurrentUserPayload) {
    return this.schedulesService.findOne(user.id);
  }

  @Get('word-books')
  findWordBooksBySchedule(@CurrentUser() user: CurrentUserPayload) {
    return this.schedulesService.findWordBooksBySchedule(user.id);
  }

  @Get('kanji-books')
  findKanjiBooksBySchedule(@CurrentUser() user: CurrentUserPayload) {
    return this.schedulesService.findKanjiBooksBySchedule(user.id);
  }
}
