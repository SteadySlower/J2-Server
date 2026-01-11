import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleDto } from './dto/schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async upsert(userId: string, scheduleDto: ScheduleDto) {
    const { study_days, review_days } = scheduleDto;

    const schedule = await this.prisma.schedule.upsert({
      where: { userId },
      update: {
        studyDays: study_days,
        reviewDays: review_days,
      },
      create: {
        userId,
        studyDays: study_days,
        reviewDays: review_days,
      },
    });

    return {
      id: schedule.id,
      user_id: schedule.userId,
      study_days: schedule.studyDays,
      review_days: schedule.reviewDays,
      created_at: schedule.createdAt.toISOString(),
      updated_at: schedule.updatedAt.toISOString(),
    };
  }

  async findOne(userId: string): Promise<{
    id: string;
    study_days: number;
    review_days: number[];
    created_at: string;
    updated_at: string;
  }> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { userId },
    });

    if (!schedule) {
      const defaultSchedule = await this.prisma.schedule.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          studyDays: 2,
          reviewDays: [7, 14, 28],
        },
      });

      return {
        id: defaultSchedule.id,
        study_days: defaultSchedule.studyDays,
        review_days: defaultSchedule.reviewDays,
        created_at: defaultSchedule.createdAt.toISOString(),
        updated_at: defaultSchedule.updatedAt.toISOString(),
      };
    }

    return {
      id: schedule.id,
      study_days: schedule.studyDays,
      review_days: schedule.reviewDays,
      created_at: schedule.createdAt.toISOString(),
      updated_at: schedule.updatedAt.toISOString(),
    };
  }

  async findWordBooksBySchedule(userId: string) {
    const schedule = await this.findOne(userId);
    const studyDays = schedule.study_days;
    const reviewDays = schedule.review_days;

    const { start: studyStart, end: studyEnd } = this.getDateRange(studyDays);
    const reviewDateRanges = this.getReviewDateRanges(reviewDays);

    const studyWordBooks = await this.prisma.wordBook.findMany({
      where: {
        userId,
        createdAt: {
          gte: studyStart,
          lte: studyEnd,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const reviewWordBooks = await this.prisma.wordBook.findMany({
      where: {
        userId,
        OR: reviewDateRanges.map((range) => ({
          createdAt: {
            gte: range.start,
            lt: range.end,
          },
        })),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      study: studyWordBooks.map((book) => ({
        id: book.id,
        title: book.title,
        status: book.status,
        show_front: book.showFront,
        created_at: book.createdAt.toISOString(),
        updated_at: book.updatedAt.toISOString(),
      })),
      review: reviewWordBooks.map((book) => ({
        id: book.id,
        title: book.title,
        status: book.status,
        show_front: book.showFront,
        created_at: book.createdAt.toISOString(),
        updated_at: book.updatedAt.toISOString(),
      })),
    };
  }

  async findKanjiBooksBySchedule(userId: string) {
    const schedule = await this.findOne(userId);
    const studyDays = schedule.study_days;
    const reviewDays = schedule.review_days;

    const { start: studyStart, end: studyEnd } = this.getDateRange(studyDays);
    const reviewDateRanges = this.getReviewDateRanges(reviewDays);

    const studyKanjiBooks = await this.prisma.kanjiBook.findMany({
      where: {
        userId,
        createdAt: {
          gte: studyStart,
          lte: studyEnd,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const reviewKanjiBooks = await this.prisma.kanjiBook.findMany({
      where: {
        userId,
        OR: reviewDateRanges.map((range) => ({
          createdAt: {
            gte: range.start,
            lt: range.end,
          },
        })),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      study: studyKanjiBooks.map((book) => ({
        id: book.id,
        title: book.title,
        status: book.status,
        show_front: book.showFront,
        created_at: book.createdAt.toISOString(),
        updated_at: book.updatedAt.toISOString(),
      })),
      review: reviewKanjiBooks.map((book) => ({
        id: book.id,
        title: book.title,
        status: book.status,
        show_front: book.showFront,
        created_at: book.createdAt.toISOString(),
        updated_at: book.updatedAt.toISOString(),
      })),
    };
  }

  /**
   * 학습 기간의 날짜 범위를 계산합니다.
   * 시간이 아닌 날짜 기준으로 계산됩니다.
   * 예: 오늘이 1월 5일이고 studyDays=2이면, 1월 3일 00:00:00부터 1월 5일 23:59:59까지
   */
  private getDateRange(studyDays: number): { start: Date; end: Date } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - studyDays);
    // start는 해당 날짜의 00:00:00

    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    // end는 오늘의 23:59:59

    return { start, end };
  }

  /**
   * 복습 날짜 범위 배열을 계산합니다.
   * 시간이 아닌 날짜 기준으로 계산됩니다.
   * 예: 오늘이 1월 5일이고 reviewDays=[7, 14, 28]이면,
   * 12월 29일 00:00:00~다음날 00:00:00 (exclusive), 12월 22일 00:00:00~다음날 00:00:00 (exclusive), 12월 8일 00:00:00~다음날 00:00:00 (exclusive)
   */
  private getReviewDateRanges(
    reviewDays: number[],
  ): Array<{ start: Date; end: Date }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return reviewDays.map((days) => {
      const start = new Date(today);
      start.setDate(start.getDate() - days);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      end.setHours(0, 0, 0, 0);
      // end는 다음 날 00:00:00 (exclusive)

      return { start, end };
    });
  }
}
