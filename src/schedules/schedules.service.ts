import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { subtractDays } from '../common/utils/date';
import { ScheduleDto } from './dto/schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async upsert(userId: string, scheduleDto: ScheduleDto, currentDate: string) {
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
    await this.prisma.review.upsert({
      where: { userId },
      update: {
        reviewDate: currentDate,
        wordBookReviews: [],
        kanjiBookReviews: [],
      },
      create: {
        userId,
        reviewDate: currentDate,
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

  async findWordBooksBySchedule(userId: string, currentDate: string) {
    const schedule = await this.findOne(userId);
    const studyDays = schedule.study_days;
    const reviewDays = schedule.review_days;

    const review = await this.getOrCreateReview(userId, currentDate);
    const reviewDate = review.reviewDate;

    const { start: studyStart, end: studyEnd } = this.getDateRange(
      studyDays,
      reviewDate,
    );
    const reviewDates = this.getReviewDates(reviewDays, reviewDate);

    const studyWordBooks = await this.prisma.wordBook.findMany({
      where: {
        userId,
        createdDate: {
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
        createdDate: {
          in: reviewDates,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const reviewedWordBookIds = new Set(review.wordBookReviews);

    // 통계: 전체 단어 수 및 learning 단어 수
    const studyWordBookIds = studyWordBooks.map((book) => book.id);
    let total = 0;
    let learning = 0;

    if (studyWordBookIds.length > 0) {
      // 두 count 쿼리를 병렬로 실행
      [total, learning] = await Promise.all([
        this.prisma.word.count({
          where: {
            bookId: { in: studyWordBookIds },
          },
        }),
        this.prisma.word.count({
          where: {
            status: 'learning',
            bookId: { in: studyWordBookIds },
          },
        }),
      ]);
    }

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
      study_statistics: {
        total,
        learning,
        review_date: review.reviewDate,
      },
    };
  }

  async findKanjiBooksBySchedule(userId: string, currentDate: string) {
    const schedule = await this.findOne(userId);
    const studyDays = schedule.study_days;
    const reviewDays = schedule.review_days;

    const review = await this.getOrCreateReview(userId, currentDate);
    const reviewDate = review.reviewDate;

    const { start: studyStart, end: studyEnd } = this.getDateRange(
      studyDays,
      reviewDate,
    );
    const reviewDates = this.getReviewDates(reviewDays, reviewDate);

    const studyKanjiBooks = await this.prisma.kanjiBook.findMany({
      where: {
        userId,
        createdDate: {
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
        createdDate: {
          in: reviewDates,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const reviewedKanjiBookIds = new Set(review.kanjiBookReviews);

    // 통계: 전체 한자 수 및 learning 한자 수
    const studyKanjiBookIds = studyKanjiBooks.map((book) => book.id);
    let total = 0;
    let learning = 0;

    if (studyKanjiBookIds.length > 0) {
      // 필요한 필드만 선택하여 조회
      const studyKanjiRelations = await this.prisma.kanjiKanjiBook.findMany({
        where: {
          kanjiBookId: { in: studyKanjiBookIds },
        },
        select: {
          kanjiId: true,
        },
      });

      const studyKanjiIds = studyKanjiRelations.map((rel) => rel.kanjiId);

      if (studyKanjiIds.length > 0) {
        // 두 count 쿼리를 병렬로 실행
        [total, learning] = await Promise.all([
          this.prisma.kanji.count({
            where: {
              id: { in: studyKanjiIds },
              userId,
            },
          }),
          this.prisma.kanji.count({
            where: {
              id: { in: studyKanjiIds },
              userId,
              status: 'learning',
            },
          }),
        ]);
      }
    }

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
      study_statistics: {
        total,
        learning,
        review_date: review.reviewDate,
      },
    };
  }

  /**
   * 학습 기간의 날짜 범위를 계산합니다 (문자열 날짜 형식).
   * 시간이 아닌 날짜 기준으로 계산됩니다.
   * 예: 오늘이 2026-01-05이고 studyDays=2이면, 2026-01-03부터 2026-01-05까지
   */
  private getDateRange(
    studyDays: number,
    currentDate: string,
  ): { start: string; end: string } {
    const startDateStr = subtractDays(currentDate, studyDays);
    return { start: startDateStr, end: currentDate };
  }

  /**
   * 복습 날짜 배열을 계산합니다 (문자열 날짜 형식).
   * 시간이 아닌 날짜 기준으로 계산됩니다.
   * 예: 오늘이 2026-01-15이고 reviewDays=[7, 14, 28]이면,
   * ["2026-01-08", "2026-01-01", "2025-12-18"]
   */
  private getReviewDates(reviewDays: number[], currentDate: string): string[] {
    return reviewDays.map((days) => subtractDays(currentDate, days));
  }

  /**
   * Review를 가져오거나 생성합니다.
   * userId가 unique이므로 사용자당 최대 1개의 Review만 존재합니다.
   * 여러 곳에서 사용되므로 내부 함수로 분리했습니다.
   * 날짜가 지난 경우에도 자동으로 리셋하지 않고, 사용자가 직접 리셋할 때까지 기존 데이터를 유지합니다.
   */
  private async getOrCreateReview(userId: string, currentDate: string) {
    // userId가 unique이므로 최대 1개만 존재
    const existingReview = await this.prisma.review.findUnique({
      where: { userId },
    });

    if (!existingReview) {
      // Review가 없으면 새로 생성
      const newReview = await this.prisma.review.create({
        data: {
          userId,
          reviewDate: currentDate,
          wordBookReviews: [],
          kanjiBookReviews: [],
        },
      });
      return newReview;
    }

    // Review가 있으면 기존 Review 그대로 사용 (날짜가 지나도 자동 리셋하지 않음)
    return existingReview;
  }

  /**
   * 단어장 또는 한자장의 존재 여부와 소유권을 확인합니다.
   */
  private async validateBookOwnership(
    bookId: string,
    userId: string,
    bookType: 'wordBook' | 'kanjiBook',
  ) {
    if (bookType === 'wordBook') {
      const wordBook = await this.prisma.wordBook.findUnique({
        where: { id: bookId },
      });

      if (!wordBook) {
        throw new NotFoundException('단어장을 찾을 수 없습니다.');
      }

      if (wordBook.userId !== userId) {
        throw new ForbiddenException('이 단어장에 접근할 권한이 없습니다.');
      }
    } else {
      const kanjiBook = await this.prisma.kanjiBook.findUnique({
        where: { id: bookId },
      });

      if (!kanjiBook) {
        throw new NotFoundException('한자장을 찾을 수 없습니다.');
      }

      if (kanjiBook.userId !== userId) {
        throw new ForbiddenException('이 한자장에 접근할 권한이 없습니다.');
      }
    }
  }

  /**
   * Review에 단어장 또는 한자장 ID를 추가하는 공통 로직입니다.
   */
  private async addBookReviewToReview(
    userId: string,
    bookId: string,
    field: 'wordBookReviews' | 'kanjiBookReviews',
    currentDate: string,
  ) {
    const review = await this.getOrCreateReview(userId, currentDate);

    const updatedReviews = [...review[field]];
    if (!updatedReviews.includes(bookId)) {
      updatedReviews.push(bookId);
    }

    const updatedReview = await this.prisma.review.update({
      where: { userId },
      data: {
        [field]: updatedReviews,
      },
    });

    return {
      id: updatedReview.id,
      user_id: updatedReview.userId,
      review_date: updatedReview.reviewDate,
      word_book_reviews: updatedReview.wordBookReviews,
      kanji_book_reviews: updatedReview.kanjiBookReviews,
      created_at: updatedReview.createdAt.toISOString(),
      updated_at: updatedReview.updatedAt.toISOString(),
    };
  }

  async addWordBookReview(
    userId: string,
    wordBookId: string,
    currentDate: string,
  ) {
    await this.validateBookOwnership(wordBookId, userId, 'wordBook');
    return this.addBookReviewToReview(
      userId,
      wordBookId,
      'wordBookReviews',
      currentDate,
    );
  }

  async addKanjiBookReview(
    userId: string,
    kanjiBookId: string,
    currentDate: string,
  ) {
    await this.validateBookOwnership(kanjiBookId, userId, 'kanjiBook');
    return this.addBookReviewToReview(
      userId,
      kanjiBookId,
      'kanjiBookReviews',
      currentDate,
    );
  }

  async resetReview(userId: string, currentDate: string) {
    const review = await this.prisma.review.upsert({
      where: { userId },
      update: {
        reviewDate: currentDate,
        wordBookReviews: [],
        kanjiBookReviews: [],
      },
      create: {
        userId,
        reviewDate: currentDate,
        wordBookReviews: [],
        kanjiBookReviews: [],
      },
    });

    return {
      id: review.id,
      user_id: review.userId,
      review_date: review.reviewDate,
      word_book_reviews: review.wordBookReviews,
      kanji_book_reviews: review.kanjiBookReviews,
      created_at: review.createdAt.toISOString(),
      updated_at: review.updatedAt.toISOString(),
    };
  }
}
