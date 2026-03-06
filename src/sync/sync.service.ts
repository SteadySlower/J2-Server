import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PushPayload } from './dto/push.dto';
import { SyncDeletionService } from './sync-deletion.service';

const CONFLICT_MESSAGE =
  '동기화 충돌: 서버에 더 최신 데이터가 있습니다. pull 후 재시도해 주세요.';

@Injectable()
export class SyncService {
  constructor(
    private prisma: PrismaService,
    private syncDeletion: SyncDeletionService,
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

    const nextCursor: Record<string, string> = {};
    if (profiles.length > limit) {
      nextCursor.profiles = profiles[limit - 1].updatedAt.toISOString();
    }
    if (schedules.length > limit) {
      nextCursor.schedules = schedules[limit - 1].updatedAt.toISOString();
    }
    if (reviews.length > limit) {
      nextCursor.reviews = reviews[limit - 1].updatedAt.toISOString();
    }
    if (wordBooks.length > limit) {
      nextCursor.word_books = wordBooks[limit - 1].updatedAt.toISOString();
    }
    if (words.length > limit) {
      nextCursor.words = words[limit - 1].updatedAt.toISOString();
    }
    if (kanjiBooks.length > limit) {
      nextCursor.kanji_books = kanjiBooks[limit - 1].updatedAt.toISOString();
    }
    if (kanjis.length > limit) {
      nextCursor.kanjis = kanjis[limit - 1].updatedAt.toISOString();
    }
    if (wordKanjiRows.length > limit) {
      nextCursor.word_kanji = wordKanjiRows[limit - 1].updatedAt.toISOString();
    }
    if (kanjiKanjiBookRows.length > limit) {
      nextCursor.kanji_kanji_book =
        kanjiKanjiBookRows[limit - 1].updatedAt.toISOString();
    }
    const hasMore = Object.keys(nextCursor).length > 0;

    const toReturn = <T>(arr: T[], max: number): T[] => arr.slice(0, max);
    const deleted = this.buildDeletedFromLog(deletions);

    return {
      profiles: toReturn(profiles, limit).map((p) => ({
        id: p.id,
        user_id: p.userId,
        name: p.name,
        avatar_url: p.avatarUrl,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      })),
      schedules: toReturn(schedules, limit).map((s) => ({
        id: s.id,
        user_id: s.userId,
        study_days: s.studyDays,
        review_days: s.reviewDays,
        created_at: s.createdAt.toISOString(),
        updated_at: s.updatedAt.toISOString(),
      })),
      reviews: toReturn(reviews, limit).map((r) => ({
        id: r.id,
        user_id: r.userId,
        review_date: r.reviewDate,
        word_book_reviews: r.wordBookReviews,
        kanji_book_reviews: r.kanjiBookReviews,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      })),
      word_books: toReturn(wordBooks, limit).map((wb) => ({
        id: wb.id,
        user_id: wb.userId,
        title: wb.title,
        status: wb.status,
        show_front: wb.showFront,
        created_date: wb.createdDate,
        created_at: wb.createdAt.toISOString(),
        updated_at: wb.updatedAt.toISOString(),
      })),
      words: toReturn(words, limit).map((w) => ({
        id: w.id,
        book_id: w.bookId,
        japanese: w.japanese,
        meaning: w.meaning,
        pronunciation: w.pronunciation,
        status: w.status,
        created_at: w.createdAt.toISOString(),
        updated_at: w.updatedAt.toISOString(),
      })),
      kanji_books: toReturn(kanjiBooks, limit).map((kb) => ({
        id: kb.id,
        user_id: kb.userId,
        title: kb.title,
        status: kb.status,
        show_front: kb.showFront,
        created_date: kb.createdDate,
        created_at: kb.createdAt.toISOString(),
        updated_at: kb.updatedAt.toISOString(),
      })),
      kanjis: toReturn(kanjis, limit).map((k) => ({
        id: k.id,
        user_id: k.userId,
        character: k.character,
        meaning: k.meaning,
        on_reading: k.onReading,
        kun_reading: k.kunReading,
        status: k.status,
        created_at: k.createdAt.toISOString(),
        updated_at: k.updatedAt.toISOString(),
      })),
      word_kanji: toReturn(wordKanjiRows, limit).map((wk) => ({
        word_id: wk.wordId,
        kanji_id: wk.kanjiId,
        created_at: wk.createdAt.toISOString(),
        updated_at: wk.updatedAt.toISOString(),
      })),
      kanji_kanji_book: toReturn(kanjiKanjiBookRows, limit).map((kkb) => ({
        kanji_id: kkb.kanjiId,
        kanji_book_id: kkb.kanjiBookId,
        created_at: kkb.createdAt.toISOString(),
        updated_at: kkb.updatedAt.toISOString(),
      })),
      deleted,
      has_more: hasMore,
      next_cursor: hasMore ? nextCursor : undefined,
    };
  }

  private buildDeletedFromLog(
    deletions: {
      entityType: string;
      entityId: string;
      entityIdSecondary: string | null;
    }[],
  ) {
    const result = {
      word_books: [] as string[],
      words: [] as string[],
      kanji_books: [] as string[],
      kanjis: [] as string[],
      word_kanji: [] as { word_id: string; kanji_id: string }[],
      kanji_kanji_book: [] as { kanji_id: string; kanji_book_id: string }[],
    };
    for (const d of deletions) {
      switch (d.entityType) {
        case 'word_book':
          result.word_books.push(d.entityId);
          break;
        case 'word':
          result.words.push(d.entityId);
          break;
        case 'kanji_book':
          result.kanji_books.push(d.entityId);
          break;
        case 'kanji':
          result.kanjis.push(d.entityId);
          break;
        case 'word_kanji':
          if (d.entityIdSecondary) {
            result.word_kanji.push({
              word_id: d.entityId,
              kanji_id: d.entityIdSecondary,
            });
          }
          break;
        case 'kanji_kanji_book':
          if (d.entityIdSecondary) {
            result.kanji_kanji_book.push({
              kanji_id: d.entityId,
              kanji_book_id: d.entityIdSecondary,
            });
          }
          break;
      }
    }
    return result;
  }

  /**
   * 클라이언트 변경분을 서버에 반영 (LWW).
   * 409 Conflict 시: 클라이언트는 pull → merge → push 재시도.
   */
  async push(userId: string, payload: PushPayload) {
    const kanjiIdMap: Record<string, string> = {};
    return await this.prisma.$transaction(async (tx) => {
      for (const p of payload.profiles?.created ?? []) {
        const existing = await tx.profile.findUnique({
          where: { id: p.id },
        });
        if (existing) {
          if (existing.userId !== userId)
            throw new ForbiddenException('Access denied');
          if (existing.updatedAt > new Date(p.updated_at))
            throw new ConflictException(CONFLICT_MESSAGE);
          await tx.profile.update({
            where: { id: p.id },
            data: {
              name: p.name ?? undefined,
              avatarUrl: p.avatar_url ?? undefined,
            },
          });
        } else {
          await tx.profile.create({
            data: {
              id: p.id,
              userId,
              name: p.name ?? undefined,
              avatarUrl: p.avatar_url ?? undefined,
            },
          });
        }
      }
      for (const p of payload.profiles?.updated ?? []) {
        const existing = await tx.profile.findUnique({
          where: { id: p.id },
        });
        if (!existing) throw new NotFoundException(`Profile ${p.id} not found`);
        if (existing.userId !== userId)
          throw new ForbiddenException('Access denied');
        if (existing.updatedAt > new Date(p.updated_at))
          throw new ConflictException(CONFLICT_MESSAGE);
        await tx.profile.update({
          where: { id: p.id },
          data: {
            name: p.name ?? undefined,
            avatarUrl: p.avatar_url ?? undefined,
          },
        });
      }

      for (const s of payload.schedules?.created ?? []) {
        const existing = await tx.schedule.findUnique({
          where: { userId },
        });
        if (existing) {
          if (existing.updatedAt > new Date(s.updated_at))
            throw new ConflictException(CONFLICT_MESSAGE);
          await tx.schedule.update({
            where: { userId },
            data: {
              studyDays: s.study_days,
              reviewDays: s.review_days,
            },
          });
        } else {
          await tx.schedule.create({
            data: {
              id: s.id,
              userId,
              studyDays: s.study_days,
              reviewDays: s.review_days,
            },
          });
        }
      }
      for (const s of payload.schedules?.updated ?? []) {
        const existing = await tx.schedule.findUnique({
          where: { id: s.id },
        });
        if (!existing)
          throw new NotFoundException(`Schedule ${s.id} not found`);
        if (existing.userId !== userId)
          throw new ForbiddenException('Access denied');
        if (existing.updatedAt > new Date(s.updated_at))
          throw new ConflictException(CONFLICT_MESSAGE);
        await tx.schedule.update({
          where: { id: s.id },
          data: {
            studyDays: s.study_days,
            reviewDays: s.review_days,
          },
        });
      }

      for (const r of payload.reviews?.created ?? []) {
        const existing = await tx.review.findUnique({
          where: { userId },
        });
        if (existing) {
          if (existing.updatedAt > new Date(r.updated_at))
            throw new ConflictException(CONFLICT_MESSAGE);
          await tx.review.update({
            where: { userId },
            data: {
              reviewDate: r.review_date,
              wordBookReviews: r.word_book_reviews,
              kanjiBookReviews: r.kanji_book_reviews,
            },
          });
        } else {
          await tx.review.create({
            data: {
              id: r.id,
              userId,
              reviewDate: r.review_date,
              wordBookReviews: r.word_book_reviews,
              kanjiBookReviews: r.kanji_book_reviews,
            },
          });
        }
      }
      for (const r of payload.reviews?.updated ?? []) {
        const existing = await tx.review.findUnique({
          where: { id: r.id },
        });
        if (!existing) throw new NotFoundException(`Review ${r.id} not found`);
        if (existing.userId !== userId)
          throw new ForbiddenException('Access denied');
        if (existing.updatedAt > new Date(r.updated_at))
          throw new ConflictException(CONFLICT_MESSAGE);
        await tx.review.update({
          where: { id: r.id },
          data: {
            reviewDate: r.review_date,
            wordBookReviews: r.word_book_reviews,
            kanjiBookReviews: r.kanji_book_reviews,
          },
        });
      }

      for (const id of payload.word_books?.deleted ?? []) {
        const wb = await tx.wordBook.findUnique({ where: { id } });
        if (wb && wb.userId === userId) {
          await tx.wordBook.delete({ where: { id } });
          await this.syncDeletion.logWordBook(tx, userId, id);
        }
      }
      for (const wb of payload.word_books?.created ?? []) {
        const existing = await tx.wordBook.findUnique({
          where: { id: wb.id },
        });
        if (existing) {
          if (existing.userId !== userId)
            throw new ForbiddenException('Access denied');
          if (existing.updatedAt > new Date(wb.updated_at))
            throw new ConflictException(CONFLICT_MESSAGE);
          await tx.wordBook.update({
            where: { id: wb.id },
            data: {
              title: wb.title,
              status: wb.status,
              showFront: wb.show_front,
              createdDate: wb.created_date,
            },
          });
        } else {
          await tx.wordBook.create({
            data: {
              id: wb.id,
              userId,
              title: wb.title,
              status: wb.status ?? 'studying',
              showFront: wb.show_front ?? true,
              createdDate: wb.created_date,
            },
          });
        }
      }
      for (const wb of payload.word_books?.updated ?? []) {
        const existing = await tx.wordBook.findUnique({
          where: { id: wb.id },
        });
        if (!existing)
          throw new NotFoundException(`WordBook ${wb.id} not found`);
        if (existing.userId !== userId)
          throw new ForbiddenException('Access denied');
        if (existing.updatedAt > new Date(wb.updated_at))
          throw new ConflictException(CONFLICT_MESSAGE);
        await tx.wordBook.update({
          where: { id: wb.id },
          data: {
            title: wb.title,
            status: wb.status,
            showFront: wb.show_front,
            createdDate: wb.created_date,
          },
        });
      }

      for (const id of payload.kanji_books?.deleted ?? []) {
        const kb = await tx.kanjiBook.findUnique({ where: { id } });
        if (kb && kb.userId === userId) {
          await tx.kanjiBook.delete({ where: { id } });
          await this.syncDeletion.logKanjiBook(tx, userId, id);
        }
      }
      for (const kb of payload.kanji_books?.created ?? []) {
        const existing = await tx.kanjiBook.findUnique({
          where: { id: kb.id },
        });
        if (existing) {
          if (existing.userId !== userId)
            throw new ForbiddenException('Access denied');
          if (existing.updatedAt > new Date(kb.updated_at))
            throw new ConflictException(CONFLICT_MESSAGE);
          await tx.kanjiBook.update({
            where: { id: kb.id },
            data: {
              title: kb.title,
              status: kb.status,
              showFront: kb.show_front,
              createdDate: kb.created_date,
            },
          });
        } else {
          await tx.kanjiBook.create({
            data: {
              id: kb.id,
              userId,
              title: kb.title,
              status: kb.status ?? 'studying',
              showFront: kb.show_front ?? true,
              createdDate: kb.created_date,
            },
          });
        }
      }
      for (const kb of payload.kanji_books?.updated ?? []) {
        const existing = await tx.kanjiBook.findUnique({
          where: { id: kb.id },
        });
        if (!existing)
          throw new NotFoundException(`KanjiBook ${kb.id} not found`);
        if (existing.userId !== userId)
          throw new ForbiddenException('Access denied');
        if (existing.updatedAt > new Date(kb.updated_at))
          throw new ConflictException(CONFLICT_MESSAGE);
        await tx.kanjiBook.update({
          where: { id: kb.id },
          data: {
            title: kb.title,
            status: kb.status,
            showFront: kb.show_front,
            createdDate: kb.created_date,
          },
        });
      }

      for (const id of payload.kanjis?.deleted ?? []) {
        const k = await tx.kanji.findUnique({ where: { id } });
        if (k && k.userId === userId) {
          await tx.kanji.delete({ where: { id } });
          await this.syncDeletion.logKanji(tx, userId, id);
        }
      }
      for (const k of payload.kanjis?.created ?? []) {
        const existingByChar = await tx.kanji.findUnique({
          where: { userId_character: { userId, character: k.character } },
        });
        if (existingByChar) {
          kanjiIdMap[k.id] = existingByChar.id;
          if (new Date(k.updated_at) > existingByChar.updatedAt) {
            await tx.kanji.update({
              where: { id: existingByChar.id },
              data: {
                meaning: k.meaning,
                onReading: k.on_reading ?? null,
                kunReading: k.kun_reading ?? null,
                status: k.status,
              },
            });
          }
        } else {
          await tx.kanji.create({
            data: {
              id: k.id,
              userId,
              character: k.character,
              meaning: k.meaning,
              onReading: k.on_reading ?? null,
              kunReading: k.kun_reading ?? null,
              status: k.status ?? 'learning',
            },
          });
        }
      }
      for (const k of payload.kanjis?.updated ?? []) {
        const existing = await tx.kanji.findUnique({
          where: { id: k.id },
        });
        if (!existing) throw new NotFoundException(`Kanji ${k.id} not found`);
        if (existing.userId !== userId)
          throw new ForbiddenException('Access denied');
        if (existing.updatedAt > new Date(k.updated_at))
          throw new ConflictException(CONFLICT_MESSAGE);
        await tx.kanji.update({
          where: { id: k.id },
          data: {
            meaning: k.meaning,
            onReading: k.on_reading ?? null,
            kunReading: k.kun_reading ?? null,
            status: k.status,
          },
        });
      }

      for (const id of payload.words?.deleted ?? []) {
        const w = await tx.word.findUnique({
          where: { id },
          include: { book: true },
        });
        if (w && w.book.userId === userId) {
          await tx.word.delete({ where: { id } });
          await this.syncDeletion.logWord(tx, userId, id);
        }
      }
      for (const w of payload.words?.created ?? []) {
        const book = await tx.wordBook.findUnique({
          where: { id: w.book_id },
        });
        if (!book)
          throw new NotFoundException(`WordBook ${w.book_id} not found`);
        if (book.userId !== userId)
          throw new ForbiddenException('Access denied');
        const existingWord = await tx.word.findUnique({
          where: { id: w.id },
          include: { book: true },
        });
        if (existingWord) {
          if (existingWord.book.userId !== userId)
            throw new ForbiddenException('Access denied');
          if (existingWord.updatedAt > new Date(w.updated_at))
            throw new ConflictException(CONFLICT_MESSAGE);
          await tx.word.update({
            where: { id: w.id },
            data: {
              japanese: w.japanese,
              meaning: w.meaning,
              pronunciation: w.pronunciation ?? null,
              status: w.status,
            },
          });
        } else {
          const wordCount = await tx.word.count({
            where: { bookId: w.book_id },
          });
          if (wordCount >= 300)
            throw new BadRequestException(
              '단어장에는 최대 300개의 단어만 추가할 수 있습니다.',
            );
          await tx.word.create({
            data: {
              id: w.id,
              bookId: w.book_id,
              japanese: w.japanese,
              meaning: w.meaning,
              pronunciation: w.pronunciation ?? null,
              status: w.status ?? 'learning',
            },
          });
        }
      }
      for (const w of payload.words?.updated ?? []) {
        const existing = await tx.word.findUnique({
          where: { id: w.id },
          include: { book: true },
        });
        if (!existing) throw new NotFoundException(`Word ${w.id} not found`);
        if (existing.book.userId !== userId)
          throw new ForbiddenException('Access denied');
        if (existing.updatedAt > new Date(w.updated_at))
          throw new ConflictException(CONFLICT_MESSAGE);
        await tx.word.update({
          where: { id: w.id },
          data: {
            bookId: w.book_id,
            japanese: w.japanese,
            meaning: w.meaning,
            pronunciation: w.pronunciation ?? null,
            status: w.status,
          },
        });
      }

      const resolveKanjiId = (clientId: string) =>
        kanjiIdMap[clientId] ?? clientId;
      for (const wk of payload.word_kanji?.deleted ?? []) {
        const kanjiId = resolveKanjiId(wk.kanji_id);
        const w = await tx.word.findUnique({
          where: { id: wk.word_id },
          include: { book: true },
        });
        if (w && w.book.userId === userId) {
          await tx.wordKanji.deleteMany({
            where: {
              wordId: wk.word_id,
              kanjiId,
            },
          });
          await this.syncDeletion.logWordKanji(tx, userId, wk.word_id, kanjiId);
        }
      }
      for (const wk of payload.word_kanji?.created ?? []) {
        const kanjiId = resolveKanjiId(wk.kanji_id);
        const word = await tx.word.findUnique({
          where: { id: wk.word_id },
          include: { book: true },
        });
        const kanji = await tx.kanji.findUnique({
          where: { id: kanjiId },
        });
        if (!word)
          throw new BadRequestException(`Word ${wk.word_id} not found`);
        if (word.book.userId !== userId)
          throw new BadRequestException(
            `Word ${wk.word_id}: access denied (not owned by user)`,
          );
        if (!kanji)
          throw new BadRequestException(`Kanji ${wk.kanji_id} not found`);
        if (kanji.userId !== userId)
          throw new BadRequestException(
            `Kanji ${wk.kanji_id}: access denied (not owned by user)`,
          );
        await tx.wordKanji.upsert({
          where: {
            wordId_kanjiId: {
              wordId: wk.word_id,
              kanjiId,
            },
          },
          update: {},
          create: {
            wordId: wk.word_id,
            kanjiId,
          },
        });
      }

      for (const kkb of payload.kanji_kanji_book?.deleted ?? []) {
        const kanjiId = resolveKanjiId(kkb.kanji_id);
        const kanji = await tx.kanji.findUnique({
          where: { id: kanjiId },
        });
        const book = await tx.kanjiBook.findUnique({
          where: { id: kkb.kanji_book_id },
        });
        if (
          kanji &&
          kanji.userId === userId &&
          book &&
          book.userId === userId
        ) {
          await tx.kanjiKanjiBook.deleteMany({
            where: {
              kanjiId,
              kanjiBookId: kkb.kanji_book_id,
            },
          });
          await this.syncDeletion.logKanjiKanjiBook(
            tx,
            userId,
            kanjiId,
            kkb.kanji_book_id,
          );
        }
      }
      for (const kkb of payload.kanji_kanji_book?.created ?? []) {
        const kanjiId = resolveKanjiId(kkb.kanji_id);
        const kanji = await tx.kanji.findUnique({
          where: { id: kanjiId },
        });
        const book = await tx.kanjiBook.findUnique({
          where: { id: kkb.kanji_book_id },
        });
        if (!kanji)
          throw new BadRequestException(`Kanji ${kkb.kanji_id} not found`);
        if (kanji.userId !== userId)
          throw new BadRequestException(
            `Kanji ${kkb.kanji_id}: access denied (not owned by user)`,
          );
        if (!book)
          throw new BadRequestException(
            `KanjiBook ${kkb.kanji_book_id} not found`,
          );
        if (book.userId !== userId)
          throw new BadRequestException(
            `KanjiBook ${kkb.kanji_book_id}: access denied (not owned by user)`,
          );
        await tx.kanjiKanjiBook.upsert({
          where: {
            kanjiId_kanjiBookId: {
              kanjiId,
              kanjiBookId: kkb.kanji_book_id,
            },
          },
          update: {},
          create: {
            kanjiId,
            kanjiBookId: kkb.kanji_book_id,
          },
        });
      }

      const idMappings =
        Object.keys(kanjiIdMap).length > 0 ? { kanjis: kanjiIdMap } : undefined;
      return { ok: true, id_mappings: idMappings };
    });
  }
}
