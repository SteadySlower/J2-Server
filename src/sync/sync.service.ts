import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PushPayload } from './dto/push.dto';
import {
  mapKanjiKanjiBookToDto,
  mapKanjiBookToDto,
  mapKanjiToDto,
  mapProfileToDto,
  mapReviewToDto,
  mapScheduleToDto,
  mapWordBookToDto,
  mapWordKanjiToDto,
  mapWordToDto,
} from './sync-pull-dto.mappers';
import { buildDeletedFromLog } from './sync-pull.helper';
import { SyncPushHandlersService } from './sync-push-handlers.service';
import { validatePayloadConsistency } from './sync-push-validator';

@Injectable()
export class SyncService {
  constructor(
    private prisma: PrismaService,
    private pushHandlers: SyncPushHandlersService,
  ) {}

  async pull(
    userId: string,
    since: string,
    limit: number = 1000,
    cursorStr?: string,
  ) {
    const sinceDate = new Date(since);
    const cursor = cursorStr
      ? (JSON.parse(cursorStr) as Record<string, string>)
      : {};

    const getSince = (key: string) =>
      cursor[key] ? new Date(cursor[key]) : sinceDate;

    const take = limit + 1;

    const [
      profiles,
      schedules,
      reviews,
      wordBooks,
      words,
      kanjiBooks,
      kanjis,
      wordKanjiRows,
      kanjiKanjiBookRows,
      deletions,
    ] = await Promise.all([
      this.prisma.profile.findMany({
        where: { userId, updatedAt: { gt: getSince('profiles') } },
        orderBy: { updatedAt: 'asc' },
        take,
      }),
      this.prisma.schedule.findMany({
        where: { userId, updatedAt: { gt: getSince('schedules') } },
        orderBy: { updatedAt: 'asc' },
        take,
      }),
      this.prisma.review.findMany({
        where: { userId, updatedAt: { gt: getSince('reviews') } },
        orderBy: { updatedAt: 'asc' },
        take,
      }),
      this.prisma.wordBook.findMany({
        where: { userId, updatedAt: { gt: getSince('word_books') } },
        orderBy: { updatedAt: 'asc' },
        take,
      }),
      this.prisma.word.findMany({
        where: {
          book: { userId },
          updatedAt: { gt: getSince('words') },
        },
        orderBy: { updatedAt: 'asc' },
        take,
      }),
      this.prisma.kanjiBook.findMany({
        where: { userId, updatedAt: { gt: getSince('kanji_books') } },
        orderBy: { updatedAt: 'asc' },
        take,
      }),
      this.prisma.kanji.findMany({
        where: { userId, updatedAt: { gt: getSince('kanjis') } },
        orderBy: { updatedAt: 'asc' },
        take,
      }),
      this.prisma.wordKanji.findMany({
        where: {
          word: { book: { userId } },
          updatedAt: { gt: getSince('word_kanji') },
        },
        orderBy: { updatedAt: 'asc' },
        take,
      }),
      this.prisma.kanjiKanjiBook.findMany({
        where: {
          kanji: { userId },
          kanjiBook: { userId },
          updatedAt: { gt: getSince('kanji_kanji_book') },
        },
        orderBy: { updatedAt: 'asc' },
        take,
      }),
      this.prisma.syncDeletion.findMany({
        where: { userId, deletedAt: { gt: sinceDate } },
        orderBy: { deletedAt: 'asc' },
      }),
    ]);

    const cursorConfigs: [unknown[], string][] = [
      [profiles, 'profiles'],
      [schedules, 'schedules'],
      [reviews, 'reviews'],
      [wordBooks, 'word_books'],
      [words, 'words'],
      [kanjiBooks, 'kanji_books'],
      [kanjis, 'kanjis'],
      [wordKanjiRows, 'word_kanji'],
      [kanjiKanjiBookRows, 'kanji_kanji_book'],
    ];
    const nextCursor: Record<string, string> = {};
    for (const [arr, key] of cursorConfigs) {
      const a = arr as { updatedAt: Date }[];
      if (a.length > limit) {
        nextCursor[key] = a[limit - 1].updatedAt.toISOString();
      }
    }
    const hasMore = Object.keys(nextCursor).length > 0;

    const toReturn = <T>(arr: T[], max: number): T[] => arr.slice(0, max);
    const deleted = buildDeletedFromLog(deletions);

    return {
      profiles: toReturn(profiles, limit).map(mapProfileToDto),
      schedules: toReturn(schedules, limit).map(mapScheduleToDto),
      reviews: toReturn(reviews, limit).map(mapReviewToDto),
      word_books: toReturn(wordBooks, limit).map(mapWordBookToDto),
      words: toReturn(words, limit).map(mapWordToDto),
      kanji_books: toReturn(kanjiBooks, limit).map(mapKanjiBookToDto),
      kanjis: toReturn(kanjis, limit).map(mapKanjiToDto),
      word_kanji: toReturn(wordKanjiRows, limit).map(mapWordKanjiToDto),
      kanji_kanji_book: toReturn(kanjiKanjiBookRows, limit).map(
        mapKanjiKanjiBookToDto,
      ),
      deleted,
      has_more: hasMore,
      next_cursor: hasMore ? nextCursor : undefined,
    };
  }

  /**
   * 클라이언트 변경분을 서버에 반영 (LWW).
   * - 409 Conflict: 클라이언트는 pull → merge → push 재시도.
   * - 404 NotFound (예: WordBook/Word not found): 참조 대상이 다른 기기에서 삭제됨.
   *   클라이언트는 pull → merge → 변경분 재계산(삭제된 참조 제외) → push 재시도.
   *   docs/db-sync 관련 TODO.md 섹션 5 참고.
   */
  async push(userId: string, payload: PushPayload) {
    validatePayloadConsistency(payload);
    const kanjiIdMap: Record<string, string> = {};
    return await this.prisma.$transaction(async (tx) => {
      await this.pushHandlers.processProfiles(tx, userId, payload);
      await this.pushHandlers.processSchedules(tx, userId, payload);
      await this.pushHandlers.processReviews(tx, userId, payload);
      await this.pushHandlers.processWordBooks(tx, userId, payload);
      await this.pushHandlers.processKanjiBooks(tx, userId, payload);
      await this.pushHandlers.processKanjis(tx, userId, payload, kanjiIdMap);
      await this.pushHandlers.processWords(tx, userId, payload);
      await this.pushHandlers.processWordKanji(tx, userId, payload, kanjiIdMap);
      await this.pushHandlers.processKanjiKanjiBook(
        tx,
        userId,
        payload,
        kanjiIdMap,
      );
      const idMappings =
        Object.keys(kanjiIdMap).length > 0 ? { kanjis: kanjiIdMap } : undefined;
      return { ok: true, id_mappings: idMappings };
    });
  }
}
