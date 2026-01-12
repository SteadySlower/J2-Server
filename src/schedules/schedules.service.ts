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

    // Schedule이 변경되면 Review를 리셋
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.review.upsert({
      where: { userId },
      update: {
        reviewDate: today,
        wordBookReviews: [],
        kanjiBookReviews: [],
      },
      create: {
        userId,
        reviewDate: today,
        wordBookReviews: [],
        kanjiBookReviews: [],
      },
    });

    return {
      id: schedule.id,
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
      const defaultSchedule = await this.prisma.schedule.create({
        data: {
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

    const { review } = await this.getOrCreateReview(userId);
    const reviewedWordBookIds = new Set(review.wordBookReviews);

    return {
      study: studyWordBooks.map((book) => ({
        id: book.id,
        title: book.title,
        status: book.status,
        show_front: book.showFront,
        created_at: book.createdAt.toISOString(),
        updated_at: book.updatedAt.toISOString(),
      })),
      review: reviewWordBooks
        .filter((book) => !reviewedWordBookIds.has(book.id))
        .map((book) => ({
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

    const { review } = await this.getOrCreateReview(userId);
    const reviewedKanjiBookIds = new Set(review.kanjiBookReviews);

    return {
      study: studyKanjiBooks.map((book) => ({
        id: book.id,
        title: book.title,
        status: book.status,
        show_front: book.showFront,
        created_at: book.createdAt.toISOString(),
        updated_at: book.updatedAt.toISOString(),
      })),
      review: reviewKanjiBooks
        .filter((book) => !reviewedKanjiBookIds.has(book.id))
        .map((book) => ({
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

  /**
   * Review를 가져오거나 생성하고, 날짜가 오늘이 아니면 배열을 비웁니다.
   * userId가 unique이므로 사용자당 최대 1개의 Review만 존재합니다.
   * 여러 곳에서 사용되므로 내부 함수로 분리했습니다.
   */
  private async getOrCreateReview(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // userId가 unique이므로 최대 1개만 존재
    const existingReview = await this.prisma.review.findUnique({
      where: { userId },
    });

    if (!existingReview) {
      // Review가 없으면 새로 생성
      const newReview = await this.prisma.review.create({
        data: {
          userId,
          reviewDate: today,
          wordBookReviews: [],
          kanjiBookReviews: [],
        },
      });
      return {
        review: newReview,
        shouldReset: false,
      };
    }

    // Review가 있으면 날짜 확인
    const reviewDate = new Date(existingReview.reviewDate);
    reviewDate.setHours(0, 0, 0, 0);
    const shouldReset = reviewDate.getTime() !== today.getTime();

    if (shouldReset) {
      // 날짜가 다르면 배열을 비우고 날짜 업데이트
      const updatedReview = await this.prisma.review.update({
        where: { userId },
        data: {
          reviewDate: today,
          wordBookReviews: [],
          kanjiBookReviews: [],
        },
      });
      return {
        review: updatedReview,
        shouldReset: true,
      };
    }

    // 날짜가 같으면 기존 Review 그대로 사용
    return {
      review: existingReview,
      shouldReset: false,
    };
  }

  async addWordBookReview(userId: string, wordBookId: string) {
    const { review } = await this.getOrCreateReview(userId);

    const updatedWordBookReviews = [...review.wordBookReviews];
    if (!updatedWordBookReviews.includes(wordBookId)) {
      updatedWordBookReviews.push(wordBookId);
    }

    const updatedReview = await this.prisma.review.update({
      where: { userId },
      data: {
        wordBookReviews: updatedWordBookReviews,
      },
    });

    return {
      id: updatedReview.id,
      user_id: updatedReview.userId,
      review_date: updatedReview.reviewDate.toISOString().split('T')[0],
      word_book_reviews: updatedReview.wordBookReviews,
      kanji_book_reviews: updatedReview.kanjiBookReviews,
      created_at: updatedReview.createdAt.toISOString(),
      updated_at: updatedReview.updatedAt.toISOString(),
    };
  }

  async addKanjiBookReview(userId: string, kanjiBookId: string) {
    const { review } = await this.getOrCreateReview(userId);

    const updatedKanjiBookReviews = [...review.kanjiBookReviews];
    if (!updatedKanjiBookReviews.includes(kanjiBookId)) {
      updatedKanjiBookReviews.push(kanjiBookId);
    }

    const updatedReview = await this.prisma.review.update({
      where: { userId },
      data: {
        kanjiBookReviews: updatedKanjiBookReviews,
      },
    });

    return {
      id: updatedReview.id,
      user_id: updatedReview.userId,
      review_date: updatedReview.reviewDate.toISOString().split('T')[0],
      word_book_reviews: updatedReview.wordBookReviews,
      kanji_book_reviews: updatedReview.kanjiBookReviews,
      created_at: updatedReview.createdAt.toISOString(),
      updated_at: updatedReview.updatedAt.toISOString(),
    };
  }
}
