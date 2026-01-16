import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ScheduleDto } from './dto/schedule.dto';
import {
  AddWordBookReviewDto,
  AddKanjiBookReviewDto,
} from './dto/add-review.dto';
import { CurrentDateQueryDto } from './dto/current-date-query.dto';
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
    return this.schedulesService.upsert(
      user.id,
      scheduleDto,
      scheduleDto.current_date,
    );
  }

  @Get()
  findOne(@CurrentUser() user: CurrentUserPayload) {
    return this.schedulesService.findOne(user.id);
  }

  @Get('word-books')
  findWordBooksBySchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: CurrentDateQueryDto,
  ) {
    return this.schedulesService.findWordBooksBySchedule(
      user.id,
      query.current_date,
    );
  }

  @Get('kanji-books')
  findKanjiBooksBySchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: CurrentDateQueryDto,
  ) {
    return this.schedulesService.findKanjiBooksBySchedule(
      user.id,
      query.current_date,
    );
  }

  @Post('word-books/review')
  addWordBookReview(
    @CurrentUser() user: CurrentUserPayload,
    @Body() addWordBookReviewDto: AddWordBookReviewDto,
  ) {
    return this.schedulesService.addWordBookReview(
      user.id,
      addWordBookReviewDto.word_book_id,
      addWordBookReviewDto.current_date,
    );
  }

  @Post('kanji-books/review')
  addKanjiBookReview(
    @CurrentUser() user: CurrentUserPayload,
    @Body() addKanjiBookReviewDto: AddKanjiBookReviewDto,
  ) {
    return this.schedulesService.addKanjiBookReview(
      user.id,
      addKanjiBookReviewDto.kanji_book_id,
      addKanjiBookReviewDto.current_date,
    );
  }
}
