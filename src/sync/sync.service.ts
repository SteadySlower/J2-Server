import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PushPayload } from './dto/push.dto';

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async pull(userId: string, since: string) {
    const sinceDate = new Date(since);

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
    ] = await Promise.all([
      this.prisma.profile.findMany({
        where: { userId, updatedAt: { gt: sinceDate } },
      }),
      this.prisma.schedule.findMany({
        where: { userId, updatedAt: { gt: sinceDate } },
      }),
      this.prisma.review.findMany({
        where: { userId, updatedAt: { gt: sinceDate } },
      }),
      this.prisma.wordBook.findMany({
        where: { userId, updatedAt: { gt: sinceDate } },
      }),
      this.prisma.word.findMany({
        where: {
          book: { userId },
          updatedAt: { gt: sinceDate },
        },
      }),
      this.prisma.kanjiBook.findMany({
        where: { userId, updatedAt: { gt: sinceDate } },
      }),
      this.prisma.kanji.findMany({
        where: { userId, updatedAt: { gt: sinceDate } },
      }),
      this.prisma.wordKanji.findMany({
        where: {
          word: { book: { userId } },
          updatedAt: { gt: sinceDate },
        },
      }),
      this.prisma.kanjiKanjiBook.findMany({
        where: {
          kanji: { userId },
          kanjiBook: { userId },
          updatedAt: { gt: sinceDate },
        },
      }),
    ]);

    return {
      profiles: profiles.map((p) => ({
        id: p.id,
        user_id: p.userId,
        name: p.name,
        avatar_url: p.avatarUrl,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      })),
      schedules: schedules.map((s) => ({
        id: s.id,
        user_id: s.userId,
        study_days: s.studyDays,
        review_days: s.reviewDays,
        created_at: s.createdAt.toISOString(),
        updated_at: s.updatedAt.toISOString(),
      })),
      reviews: reviews.map((r) => ({
        id: r.id,
        user_id: r.userId,
        review_date: r.reviewDate,
        word_book_reviews: r.wordBookReviews,
        kanji_book_reviews: r.kanjiBookReviews,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      })),
      word_books: wordBooks.map((wb) => ({
        id: wb.id,
        user_id: wb.userId,
        title: wb.title,
        status: wb.status,
        show_front: wb.showFront,
        created_date: wb.createdDate,
        created_at: wb.createdAt.toISOString(),
        updated_at: wb.updatedAt.toISOString(),
      })),
      words: words.map((w) => ({
        id: w.id,
        book_id: w.bookId,
        japanese: w.japanese,
        meaning: w.meaning,
        pronunciation: w.pronunciation,
        status: w.status,
        created_at: w.createdAt.toISOString(),
        updated_at: w.updatedAt.toISOString(),
      })),
      kanji_books: kanjiBooks.map((kb) => ({
        id: kb.id,
        user_id: kb.userId,
        title: kb.title,
        status: kb.status,
        show_front: kb.showFront,
        created_date: kb.createdDate,
        created_at: kb.createdAt.toISOString(),
        updated_at: kb.updatedAt.toISOString(),
      })),
      kanjis: kanjis.map((k) => ({
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
      word_kanji: wordKanjiRows.map((wk) => ({
        word_id: wk.wordId,
        kanji_id: wk.kanjiId,
        created_at: wk.createdAt.toISOString(),
        updated_at: wk.updatedAt.toISOString(),
      })),
      kanji_kanji_book: kanjiKanjiBookRows.map((kkb) => ({
        kanji_id: kkb.kanjiId,
        kanji_book_id: kkb.kanjiBookId,
        created_at: kkb.createdAt.toISOString(),
        updated_at: kkb.updatedAt.toISOString(),
      })),
    };
  }

  async push(userId: string, payload: PushPayload) {
    return await this.prisma.$transaction(async (tx) => {
      for (const p of payload.profiles?.created ?? []) {
        await tx.profile.upsert({
          where: { id: p.id },
          update: {
            name: p.name ?? undefined,
            avatarUrl: p.avatar_url ?? undefined,
          },
          create: {
            id: p.id,
            userId,
            name: p.name ?? undefined,
            avatarUrl: p.avatar_url ?? undefined,
          },
        });
      }
      for (const p of payload.profiles?.updated ?? []) {
        const existing = await tx.profile.findUnique({
          where: { id: p.id },
        });
        if (!existing) throw new NotFoundException(`Profile ${p.id} not found`);
        if (existing.userId !== userId)
          throw new ForbiddenException('Access denied');
        await tx.profile.update({
          where: { id: p.id },
          data: {
            name: p.name ?? undefined,
            avatarUrl: p.avatar_url ?? undefined,
          },
        });
      }

      for (const s of payload.schedules?.created ?? []) {
        await tx.schedule.upsert({
          where: { userId },
          update: {
            studyDays: s.study_days,
            reviewDays: s.review_days,
          },
          create: {
            id: s.id,
            userId,
            studyDays: s.study_days,
            reviewDays: s.review_days,
          },
        });
      }
      for (const s of payload.schedules?.updated ?? []) {
        const existing = await tx.schedule.findUnique({
          where: { id: s.id },
        });
        if (!existing)
          throw new NotFoundException(`Schedule ${s.id} not found`);
        if (existing.userId !== userId)
          throw new ForbiddenException('Access denied');
        await tx.schedule.update({
          where: { id: s.id },
          data: {
            studyDays: s.study_days,
            reviewDays: s.review_days,
          },
        });
      }

      for (const r of payload.reviews?.created ?? []) {
        await tx.review.upsert({
          where: { userId },
          update: {
            reviewDate: r.review_date,
            wordBookReviews: r.word_book_reviews,
            kanjiBookReviews: r.kanji_book_reviews,
          },
          create: {
            id: r.id,
            userId,
            reviewDate: r.review_date,
            wordBookReviews: r.word_book_reviews,
            kanjiBookReviews: r.kanji_book_reviews,
          },
        });
      }
      for (const r of payload.reviews?.updated ?? []) {
        const existing = await tx.review.findUnique({
          where: { id: r.id },
        });
        if (!existing) throw new NotFoundException(`Review ${r.id} not found`);
        if (existing.userId !== userId)
          throw new ForbiddenException('Access denied');
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
        }
      }
      for (const wb of payload.word_books?.created ?? []) {
        await tx.wordBook.upsert({
          where: { id: wb.id },
          update: {
            title: wb.title,
            status: wb.status,
            showFront: wb.show_front,
            createdDate: wb.created_date,
          },
          create: {
            id: wb.id,
            userId,
            title: wb.title,
            status: wb.status ?? 'studying',
            showFront: wb.show_front ?? true,
            createdDate: wb.created_date,
          },
        });
      }
      for (const wb of payload.word_books?.updated ?? []) {
        const existing = await tx.wordBook.findUnique({
          where: { id: wb.id },
        });
        if (!existing)
          throw new NotFoundException(`WordBook ${wb.id} not found`);
        if (existing.userId !== userId)
          throw new ForbiddenException('Access denied');
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
        }
      }
      for (const kb of payload.kanji_books?.created ?? []) {
        await tx.kanjiBook.upsert({
          where: { id: kb.id },
          update: {
            title: kb.title,
            status: kb.status,
            showFront: kb.show_front,
            createdDate: kb.created_date,
          },
          create: {
            id: kb.id,
            userId,
            title: kb.title,
            status: kb.status ?? 'studying',
            showFront: kb.show_front ?? true,
            createdDate: kb.created_date,
          },
        });
      }
      for (const kb of payload.kanji_books?.updated ?? []) {
        const existing = await tx.kanjiBook.findUnique({
          where: { id: kb.id },
        });
        if (!existing)
          throw new NotFoundException(`KanjiBook ${kb.id} not found`);
        if (existing.userId !== userId)
          throw new ForbiddenException('Access denied');
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
        }
      }
      for (const k of payload.kanjis?.created ?? []) {
        await tx.kanji.upsert({
          where: { id: k.id },
          update: {
            meaning: k.meaning,
            onReading: k.on_reading ?? null,
            kunReading: k.kun_reading ?? null,
            status: k.status,
          },
          create: {
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
      for (const k of payload.kanjis?.updated ?? []) {
        const existing = await tx.kanji.findUnique({
          where: { id: k.id },
        });
        if (!existing) throw new NotFoundException(`Kanji ${k.id} not found`);
        if (existing.userId !== userId)
          throw new ForbiddenException('Access denied');
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
        const wordCount = await tx.word.count({
          where: { bookId: w.book_id },
        });
        if (wordCount >= 300)
          throw new BadRequestException(
            '단어장에는 최대 300개의 단어만 추가할 수 있습니다.',
          );
        await tx.word.upsert({
          where: { id: w.id },
          update: {
            japanese: w.japanese,
            meaning: w.meaning,
            pronunciation: w.pronunciation ?? null,
            status: w.status,
          },
          create: {
            id: w.id,
            bookId: w.book_id,
            japanese: w.japanese,
            meaning: w.meaning,
            pronunciation: w.pronunciation ?? null,
            status: w.status ?? 'learning',
          },
        });
      }
      for (const w of payload.words?.updated ?? []) {
        const existing = await tx.word.findUnique({
          where: { id: w.id },
          include: { book: true },
        });
        if (!existing) throw new NotFoundException(`Word ${w.id} not found`);
        if (existing.book.userId !== userId)
          throw new ForbiddenException('Access denied');
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

      for (const wk of payload.word_kanji?.deleted ?? []) {
        const w = await tx.word.findUnique({
          where: { id: wk.word_id },
          include: { book: true },
        });
        if (w && w.book.userId === userId) {
          await tx.wordKanji.deleteMany({
            where: {
              wordId: wk.word_id,
              kanjiId: wk.kanji_id,
            },
          });
        }
      }
      for (const wk of payload.word_kanji?.created ?? []) {
        const word = await tx.word.findUnique({
          where: { id: wk.word_id },
          include: { book: true },
        });
        const kanji = await tx.kanji.findUnique({
          where: { id: wk.kanji_id },
        });
        if (
          word &&
          word.book.userId === userId &&
          kanji &&
          kanji.userId === userId
        ) {
          await tx.wordKanji.upsert({
            where: {
              wordId_kanjiId: {
                wordId: wk.word_id,
                kanjiId: wk.kanji_id,
              },
            },
            update: {},
            create: {
              wordId: wk.word_id,
              kanjiId: wk.kanji_id,
            },
          });
        }
      }

      for (const kkb of payload.kanji_kanji_book?.deleted ?? []) {
        const kanji = await tx.kanji.findUnique({
          where: { id: kkb.kanji_id },
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
              kanjiId: kkb.kanji_id,
              kanjiBookId: kkb.kanji_book_id,
            },
          });
        }
      }
      for (const kkb of payload.kanji_kanji_book?.created ?? []) {
        const kanji = await tx.kanji.findUnique({
          where: { id: kkb.kanji_id },
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
          await tx.kanjiKanjiBook.upsert({
            where: {
              kanjiId_kanjiBookId: {
                kanjiId: kkb.kanji_id,
                kanjiBookId: kkb.kanji_book_id,
              },
            },
            update: {},
            create: {
              kanjiId: kkb.kanji_id,
              kanjiBookId: kkb.kanji_book_id,
            },
          });
        }
      }

      return { ok: true };
    });
  }
}
