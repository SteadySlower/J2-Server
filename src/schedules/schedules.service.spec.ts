import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { PrismaService } from '../prisma/prisma.service';

// SchedulesService를 import하는 순간 prisma.service.ts가 import 되고 거기서 generated/prisma/client.ts를 import한다.
// 그런데 실제 client를 사용하면 안되므로 여기서 일단 import 자체를 mocking 해버린다.
// 참고로 mocking은 hoisting 되므로 import 보다 아래에 두어도 상관 없다.
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('SchedulesService', () => {
  let service: SchedulesService;

  const prismaMock = {
    schedule: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    review: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    wordBook: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    kanjiBook: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  type PrismaMock = typeof prismaMock;
  let prismaService: PrismaMock;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
    prismaService = module.get(PrismaService);
  });

  describe('upsert', () => {
    it('스케줄을 생성하고 Review를 리셋해야 함', async () => {
      const userId = 'user-1';
      const currentDate = '2026-01-15';
      const scheduleDto = {
        study_days: 3,
        review_days: [7, 14, 28],
        current_date: currentDate,
      };

      const mockSchedule = {
        id: 'schedule-1',
        userId,
        studyDays: 3,
        reviewDays: [7, 14, 28],
        createdAt: new Date('2026-01-15T00:00:00Z'),
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      const mockReview = {
        id: 'review-1',
        userId,
        reviewDate: currentDate,
        wordBookReviews: [],
        kanjiBookReviews: [],
        createdAt: new Date('2026-01-15T00:00:00Z'),
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      prismaService.schedule.upsert.mockResolvedValue(mockSchedule);
      prismaService.review.upsert.mockResolvedValue(mockReview);

      const result = await service.upsert(userId, scheduleDto, currentDate);

      expect(prismaService.schedule.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: {
          studyDays: 3,
          reviewDays: [7, 14, 28],
        },
        create: {
          userId,
          studyDays: 3,
          reviewDays: [7, 14, 28],
        },
      });

      expect(prismaService.review.upsert).toHaveBeenCalledWith({
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

      expect(result).toEqual({
        id: 'schedule-1',
        study_days: 3,
        review_days: [7, 14, 28],
        created_at: mockSchedule.createdAt.toISOString(),
        updated_at: mockSchedule.updatedAt.toISOString(),
      });
    });
  });

  describe('findOne', () => {
    it('기존 스케줄이 있으면 반환해야 함', async () => {
      const userId = 'user-1';
      const mockSchedule = {
        id: 'schedule-1',
        userId,
        studyDays: 2,
        reviewDays: [7, 14, 28],
        createdAt: new Date('2026-01-15T00:00:00Z'),
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      prismaService.schedule.findUnique.mockResolvedValue(mockSchedule);

      const result = await service.findOne(userId);

      expect(prismaService.schedule.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });

      expect(result).toEqual({
        id: 'schedule-1',
        study_days: 2,
        review_days: [7, 14, 28],
        created_at: mockSchedule.createdAt.toISOString(),
        updated_at: mockSchedule.updatedAt.toISOString(),
      });
    });

    it('기존 스케줄이 없으면 기본 스케줄을 생성하고 반환해야 함', async () => {
      const userId = 'user-1';
      const mockDefaultSchedule = {
        id: 'schedule-1',
        userId,
        studyDays: 2,
        reviewDays: [7, 14, 28],
        createdAt: new Date('2026-01-15T00:00:00Z'),
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      prismaService.schedule.findUnique.mockResolvedValue(null);
      prismaService.schedule.create.mockResolvedValue(mockDefaultSchedule);

      const result = await service.findOne(userId);

      expect(prismaService.schedule.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });

      expect(prismaService.schedule.create).toHaveBeenCalledWith({
        data: {
          userId,
          studyDays: 2,
          reviewDays: [7, 14, 28],
        },
      });

      expect(result).toEqual({
        id: 'schedule-1',
        study_days: 2,
        review_days: [7, 14, 28],
        created_at: mockDefaultSchedule.createdAt.toISOString(),
        updated_at: mockDefaultSchedule.updatedAt.toISOString(),
      });
    });
  });

  describe('findWordBooksBySchedule', () => {
    it('학습 및 복습 단어장을 반환해야 함', async () => {
      const userId = 'user-1';
      const currentDate = '2026-01-15';

      const mockSchedule = {
        id: 'schedule-1',
        userId,
        studyDays: 2,
        reviewDays: [7, 14],
        createdAt: new Date('2026-01-15T00:00:00Z'),
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      const mockStudyWordBooks = [
        {
          id: 'word-book-1',
          userId,
          title: 'Study Book 1',
          status: 'studying',
          showFront: true,
          createdDate: '2026-01-14',
          createdAt: new Date('2026-01-14T00:00:00Z'),
          updatedAt: new Date('2026-01-14T00:00:00Z'),
        },
      ];

      const mockReviewWordBooks = [
        {
          id: 'word-book-2',
          userId,
          title: 'Review Book 1',
          status: 'studying',
          showFront: false,
          createdDate: '2026-01-08',
          createdAt: new Date('2026-01-08T00:00:00Z'),
          updatedAt: new Date('2026-01-08T00:00:00Z'),
        },
        {
          id: 'word-book-3',
          userId,
          title: 'Review Book 2',
          status: 'studying',
          showFront: true,
          createdDate: '2026-01-01',
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-01T00:00:00Z'),
        },
      ];

      const mockReview = {
        id: 'review-1',
        userId,
        reviewDate: currentDate,
        wordBookReviews: ['word-book-2'],
        kanjiBookReviews: [],
        createdAt: new Date('2026-01-15T00:00:00Z'),
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'schedule-1',
        study_days: 2,
        review_days: [7, 14],
        created_at: mockSchedule.createdAt.toISOString(),
        updated_at: mockSchedule.updatedAt.toISOString(),
      });

      prismaService.wordBook.findMany
        .mockResolvedValueOnce(mockStudyWordBooks)
        .mockResolvedValueOnce(mockReviewWordBooks);

      prismaService.review.findUnique.mockResolvedValue(mockReview);

      const result = await service.findWordBooksBySchedule(userId, currentDate);

      expect(prismaService.wordBook.findMany).toHaveBeenCalledTimes(2);
      expect(result.study).toHaveLength(1);
      expect(result.review).toHaveLength(1);
      expect(result.review[0].id).toBe('word-book-3');
    });

    it('Review가 없으면 새로 생성해야 함', async () => {
      const userId = 'user-1';
      const currentDate = '2026-01-15';

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'schedule-1',
        study_days: 2,
        review_days: [7, 14],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      prismaService.wordBook.findMany.mockResolvedValue([]);
      prismaService.review.findUnique.mockResolvedValue(null);

      const mockNewReview = {
        id: 'review-1',
        userId,
        reviewDate: currentDate,
        wordBookReviews: [],
        kanjiBookReviews: [],
        createdAt: new Date('2026-01-15T00:00:00Z'),
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      prismaService.review.create.mockResolvedValue(mockNewReview);

      await service.findWordBooksBySchedule(userId, currentDate);

      expect(prismaService.review.create).toHaveBeenCalledWith({
        data: {
          userId,
          reviewDate: currentDate,
          wordBookReviews: [],
          kanjiBookReviews: [],
        },
      });
    });

    it('Review 날짜가 다르면 리셋해야 함', async () => {
      const userId = 'user-1';
      const currentDate = '2026-01-15';

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'schedule-1',
        study_days: 2,
        review_days: [7, 14],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      prismaService.wordBook.findMany.mockResolvedValue([]);

      const mockExistingReview = {
        id: 'review-1',
        userId,
        reviewDate: '2026-01-14',
        wordBookReviews: ['word-book-1'],
        kanjiBookReviews: [],
        createdAt: new Date('2026-01-14T00:00:00Z'),
        updatedAt: new Date('2026-01-14T00:00:00Z'),
      };

      const mockUpdatedReview = {
        ...mockExistingReview,
        reviewDate: currentDate,
        wordBookReviews: [],
        kanjiBookReviews: [],
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      prismaService.review.findUnique.mockResolvedValue(mockExistingReview);
      prismaService.review.update.mockResolvedValue(mockUpdatedReview);

      await service.findWordBooksBySchedule(userId, currentDate);

      expect(prismaService.review.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          reviewDate: currentDate,
          wordBookReviews: [],
          kanjiBookReviews: [],
        },
      });
    });
  });

  describe('findKanjiBooksBySchedule', () => {
    it('학습 및 복습 한자장을 반환해야 함', async () => {
      const userId = 'user-1';
      const currentDate = '2026-01-15';

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'schedule-1',
        study_days: 2,
        review_days: [7, 14],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const mockStudyKanjiBooks = [
        {
          id: 'kanji-book-1',
          userId,
          title: 'Study Kanji Book 1',
          status: 'studying',
          showFront: true,
          createdDate: '2026-01-14',
          createdAt: new Date('2026-01-14T00:00:00Z'),
          updatedAt: new Date('2026-01-14T00:00:00Z'),
        },
      ];

      const mockReviewKanjiBooks = [
        {
          id: 'kanji-book-2',
          userId,
          title: 'Review Kanji Book 1',
          status: 'studying',
          showFront: false,
          createdDate: '2026-01-08',
          createdAt: new Date('2026-01-08T00:00:00Z'),
          updatedAt: new Date('2026-01-08T00:00:00Z'),
        },
      ];

      const mockReview = {
        id: 'review-1',
        userId,
        reviewDate: currentDate,
        wordBookReviews: [],
        kanjiBookReviews: [],
        createdAt: new Date('2026-01-15T00:00:00Z'),
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      prismaService.kanjiBook.findMany
        .mockResolvedValueOnce(mockStudyKanjiBooks)
        .mockResolvedValueOnce(mockReviewKanjiBooks);

      prismaService.review.findUnique.mockResolvedValue(mockReview);

      const result = await service.findKanjiBooksBySchedule(
        userId,
        currentDate,
      );

      expect(prismaService.kanjiBook.findMany).toHaveBeenCalledTimes(2);
      expect(result.study).toHaveLength(1);
      expect(result.review).toHaveLength(1);
    });
  });

  describe('addWordBookReview', () => {
    it('단어장 복습을 추가해야 함', async () => {
      const userId = 'user-1';
      const wordBookId = 'word-book-1';
      const currentDate = '2026-01-15';

      const mockWordBook = {
        id: wordBookId,
        userId,
        title: 'Test Book',
        status: 'active',
        showFront: true,
        createdDate: '2026-01-10',
        createdAt: new Date('2026-01-10T00:00:00Z'),
        updatedAt: new Date('2026-01-10T00:00:00Z'),
      };

      const mockReview = {
        id: 'review-1',
        userId,
        reviewDate: currentDate,
        wordBookReviews: [],
        kanjiBookReviews: [],
        createdAt: new Date('2026-01-15T00:00:00Z'),
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      const mockUpdatedReview = {
        ...mockReview,
        wordBookReviews: [wordBookId],
        updatedAt: new Date('2026-01-15T01:00:00Z'),
      };

      prismaService.wordBook.findUnique.mockResolvedValue(mockWordBook);
      prismaService.review.findUnique.mockResolvedValue(mockReview);
      prismaService.review.update.mockResolvedValue(mockUpdatedReview);

      const result = await service.addWordBookReview(
        userId,
        wordBookId,
        currentDate,
      );

      expect(prismaService.wordBook.findUnique).toHaveBeenCalledWith({
        where: { id: wordBookId },
      });

      expect(prismaService.review.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          wordBookReviews: [wordBookId],
        },
      });

      expect(result.word_book_reviews).toEqual([wordBookId]);
    });

    it('단어장이 없으면 NotFoundException을 던져야 함', async () => {
      const userId = 'user-1';
      const wordBookId = 'word-book-1';
      const currentDate = '2026-01-15';

      prismaService.wordBook.findUnique.mockResolvedValue(null);

      await expect(
        service.addWordBookReview(userId, wordBookId, currentDate),
      ).rejects.toThrow(NotFoundException);

      expect(prismaService.wordBook.findUnique).toHaveBeenCalledWith({
        where: { id: wordBookId },
      });
    });

    it('다른 사용자의 단어장이면 ForbiddenException을 던져야 함', async () => {
      const userId = 'user-1';
      const wordBookId = 'word-book-1';
      const currentDate = '2026-01-15';

      const mockWordBook = {
        id: wordBookId,
        userId: 'user-2',
        title: 'Test Book',
        status: 'active',
        showFront: true,
        createdDate: '2026-01-10',
        createdAt: new Date('2026-01-10T00:00:00Z'),
        updatedAt: new Date('2026-01-10T00:00:00Z'),
      };

      prismaService.wordBook.findUnique.mockResolvedValue(mockWordBook);

      await expect(
        service.addWordBookReview(userId, wordBookId, currentDate),
      ).rejects.toThrow(ForbiddenException);
    });

    it('이미 복습 목록에 있으면 중복 추가하지 않아야 함', async () => {
      const userId = 'user-1';
      const wordBookId = 'word-book-1';
      const currentDate = '2026-01-15';

      const mockWordBook = {
        id: wordBookId,
        userId,
        title: 'Test Book',
        status: 'active',
        showFront: true,
        createdDate: '2026-01-10',
        createdAt: new Date('2026-01-10T00:00:00Z'),
        updatedAt: new Date('2026-01-10T00:00:00Z'),
      };

      const mockReview = {
        id: 'review-1',
        userId,
        reviewDate: currentDate,
        wordBookReviews: [wordBookId],
        kanjiBookReviews: [],
        createdAt: new Date('2026-01-15T00:00:00Z'),
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      const mockUpdatedReview = {
        ...mockReview,
        updatedAt: new Date('2026-01-15T01:00:00Z'),
      };

      prismaService.wordBook.findUnique.mockResolvedValue(mockWordBook);
      prismaService.review.findUnique.mockResolvedValue(mockReview);
      prismaService.review.update.mockResolvedValue(mockUpdatedReview);

      await service.addWordBookReview(userId, wordBookId, currentDate);

      expect(prismaService.review.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          wordBookReviews: [wordBookId],
        },
      });
    });

    it('currentDate가 reviewDate와 다르면 review가 리셋되어야 함', async () => {
      const userId = 'user-1';
      const wordBookId = 'word-book-1';
      const currentDate = '2026-01-15';
      const oldReviewDate = '2026-01-14';

      const mockWordBook = {
        id: wordBookId,
        userId,
        title: 'Test Book',
        status: 'active',
        showFront: true,
        createdDate: '2026-01-10',
        createdAt: new Date('2026-01-10T00:00:00Z'),
        updatedAt: new Date('2026-01-10T00:00:00Z'),
      };

      const mockExistingReview = {
        id: 'review-1',
        userId,
        reviewDate: oldReviewDate,
        wordBookReviews: ['word-book-2', 'word-book-3'],
        kanjiBookReviews: ['kanji-book-1'],
        createdAt: new Date('2026-01-14T00:00:00Z'),
        updatedAt: new Date('2026-01-14T00:00:00Z'),
      };

      const mockResetReview = {
        ...mockExistingReview,
        reviewDate: currentDate,
        wordBookReviews: [],
        kanjiBookReviews: [],
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      const mockFinalReview = {
        ...mockResetReview,
        wordBookReviews: [wordBookId],
        updatedAt: new Date('2026-01-15T01:00:00Z'),
      };

      prismaService.wordBook.findUnique.mockResolvedValue(mockWordBook);
      prismaService.review.findUnique.mockResolvedValue(mockExistingReview);
      prismaService.review.update
        .mockResolvedValueOnce(mockResetReview)
        .mockResolvedValueOnce(mockFinalReview);

      const result = await service.addWordBookReview(
        userId,
        wordBookId,
        currentDate,
      );

      expect(prismaService.review.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });

      expect(prismaService.review.update).toHaveBeenCalledTimes(2);

      expect(prismaService.review.update).toHaveBeenNthCalledWith(1, {
        where: { userId },
        data: {
          reviewDate: currentDate,
          wordBookReviews: [],
          kanjiBookReviews: [],
        },
      });

      expect(prismaService.review.update).toHaveBeenNthCalledWith(2, {
        where: { userId },
        data: {
          wordBookReviews: [wordBookId],
        },
      });

      expect(result.word_book_reviews).toEqual([wordBookId]);
      expect(result.kanji_book_reviews).toEqual([]);
      expect(result.review_date).toBe(currentDate);
    });
  });

  describe('addKanjiBookReview', () => {
    it('한자장 복습을 추가해야 함', async () => {
      const userId = 'user-1';
      const kanjiBookId = 'kanji-book-1';
      const currentDate = '2026-01-15';

      const mockKanjiBook = {
        id: kanjiBookId,
        userId,
        title: 'Test Kanji Book',
        status: 'active',
        showFront: true,
        createdDate: '2026-01-10',
        createdAt: new Date('2026-01-10T00:00:00Z'),
        updatedAt: new Date('2026-01-10T00:00:00Z'),
      };

      const mockReview = {
        id: 'review-1',
        userId,
        reviewDate: currentDate,
        wordBookReviews: [],
        kanjiBookReviews: [],
        createdAt: new Date('2026-01-15T00:00:00Z'),
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      const mockUpdatedReview = {
        ...mockReview,
        kanjiBookReviews: [kanjiBookId],
        updatedAt: new Date('2026-01-15T01:00:00Z'),
      };

      prismaService.kanjiBook.findUnique.mockResolvedValue(mockKanjiBook);
      prismaService.review.findUnique.mockResolvedValue(mockReview);
      prismaService.review.update.mockResolvedValue(mockUpdatedReview);

      const result = await service.addKanjiBookReview(
        userId,
        kanjiBookId,
        currentDate,
      );

      expect(prismaService.kanjiBook.findUnique).toHaveBeenCalledWith({
        where: { id: kanjiBookId },
      });

      expect(prismaService.review.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          kanjiBookReviews: [kanjiBookId],
        },
      });

      expect(result.kanji_book_reviews).toEqual([kanjiBookId]);
    });

    it('한자장이 없으면 NotFoundException을 던져야 함', async () => {
      const userId = 'user-1';
      const kanjiBookId = 'kanji-book-1';
      const currentDate = '2026-01-15';

      prismaService.kanjiBook.findUnique.mockResolvedValue(null);

      await expect(
        service.addKanjiBookReview(userId, kanjiBookId, currentDate),
      ).rejects.toThrow(NotFoundException);
    });

    it('다른 사용자의 한자장이면 ForbiddenException을 던져야 함', async () => {
      const userId = 'user-1';
      const kanjiBookId = 'kanji-book-1';
      const currentDate = '2026-01-15';

      const mockKanjiBook = {
        id: kanjiBookId,
        userId: 'user-2',
        title: 'Test Kanji Book',
        status: 'active',
        showFront: true,
        createdDate: '2026-01-10',
        createdAt: new Date('2026-01-10T00:00:00Z'),
        updatedAt: new Date('2026-01-10T00:00:00Z'),
      };

      prismaService.kanjiBook.findUnique.mockResolvedValue(mockKanjiBook);

      await expect(
        service.addKanjiBookReview(userId, kanjiBookId, currentDate),
      ).rejects.toThrow(ForbiddenException);
    });

    it('currentDate가 reviewDate와 다르면 review가 리셋되어야 함', async () => {
      const userId = 'user-1';
      const kanjiBookId = 'kanji-book-1';
      const currentDate = '2026-01-15';
      const oldReviewDate = '2026-01-14';

      const mockKanjiBook = {
        id: kanjiBookId,
        userId,
        title: 'Test Kanji Book',
        status: 'active',
        showFront: true,
        createdDate: '2026-01-10',
        createdAt: new Date('2026-01-10T00:00:00Z'),
        updatedAt: new Date('2026-01-10T00:00:00Z'),
      };

      const mockExistingReview = {
        id: 'review-1',
        userId,
        reviewDate: oldReviewDate,
        wordBookReviews: ['word-book-1'],
        kanjiBookReviews: ['kanji-book-2', 'kanji-book-3'],
        createdAt: new Date('2026-01-14T00:00:00Z'),
        updatedAt: new Date('2026-01-14T00:00:00Z'),
      };

      const mockResetReview = {
        ...mockExistingReview,
        reviewDate: currentDate,
        wordBookReviews: [],
        kanjiBookReviews: [],
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      const mockFinalReview = {
        ...mockResetReview,
        kanjiBookReviews: [kanjiBookId],
        updatedAt: new Date('2026-01-15T01:00:00Z'),
      };

      prismaService.kanjiBook.findUnique.mockResolvedValue(mockKanjiBook);
      prismaService.review.findUnique.mockResolvedValue(mockExistingReview);
      prismaService.review.update
        .mockResolvedValueOnce(mockResetReview)
        .mockResolvedValueOnce(mockFinalReview);

      const result = await service.addKanjiBookReview(
        userId,
        kanjiBookId,
        currentDate,
      );

      expect(prismaService.review.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });

      expect(prismaService.review.update).toHaveBeenCalledTimes(2);

      expect(prismaService.review.update).toHaveBeenNthCalledWith(1, {
        where: { userId },
        data: {
          reviewDate: currentDate,
          wordBookReviews: [],
          kanjiBookReviews: [],
        },
      });

      expect(prismaService.review.update).toHaveBeenNthCalledWith(2, {
        where: { userId },
        data: {
          kanjiBookReviews: [kanjiBookId],
        },
      });

      expect(result.kanji_book_reviews).toEqual([kanjiBookId]);
      expect(result.word_book_reviews).toEqual([]);
      expect(result.review_date).toBe(currentDate);
    });
  });

  describe('resetReview', () => {
    it('기존 review가 있으면 배열을 비우고 날짜를 업데이트해야 함', async () => {
      const userId = 'user-1';
      const currentDate = '2026-01-15';

      const mockExistingReview = {
        id: 'review-1',
        userId,
        reviewDate: '2026-01-14',
        wordBookReviews: ['word-book-1', 'word-book-2'],
        kanjiBookReviews: ['kanji-book-1', 'kanji-book-2'],
        createdAt: new Date('2026-01-14T00:00:00Z'),
        updatedAt: new Date('2026-01-14T00:00:00Z'),
      };

      const mockResetReview = {
        ...mockExistingReview,
        reviewDate: currentDate,
        wordBookReviews: [],
        kanjiBookReviews: [],
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      prismaService.review.upsert.mockResolvedValue(mockResetReview);

      const result = await service.resetReview(userId, currentDate);

      expect(prismaService.review.upsert).toHaveBeenCalledWith({
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

      expect(result.id).toBe('review-1');
      expect(result.user_id).toBe(userId);
      expect(result.review_date).toBe(currentDate);
      expect(result.word_book_reviews).toEqual([]);
      expect(result.kanji_book_reviews).toEqual([]);
    });

    it('review가 없으면 새로 생성해야 함', async () => {
      const userId = 'user-1';
      const currentDate = '2026-01-15';

      const mockNewReview = {
        id: 'review-1',
        userId,
        reviewDate: currentDate,
        wordBookReviews: [],
        kanjiBookReviews: [],
        createdAt: new Date('2026-01-15T00:00:00Z'),
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      };

      prismaService.review.upsert.mockResolvedValue(mockNewReview);

      const result = await service.resetReview(userId, currentDate);

      expect(prismaService.review.upsert).toHaveBeenCalledWith({
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

      expect(result.id).toBe('review-1');
      expect(result.user_id).toBe(userId);
      expect(result.review_date).toBe(currentDate);
      expect(result.word_book_reviews).toEqual([]);
      expect(result.kanji_book_reviews).toEqual([]);
    });
  });
});
