import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PrismaTransactionClient } from '../prisma/prisma.types';

type PrismaClient = PrismaService | PrismaTransactionClient;

export const SYNC_DELETION_ENTITY = {
  WORD_BOOK: 'word_book',
  WORD: 'word',
  KANJI_BOOK: 'kanji_book',
  KANJI: 'kanji',
  WORD_KANJI: 'word_kanji',
  KANJI_KANJI_BOOK: 'kanji_kanji_book',
} as const;

@Injectable()
export class SyncDeletionService {
  constructor(private prisma: PrismaService) {}

  private async log(
    client: PrismaClient,
    userId: string,
    entityType: string,
    entityId: string,
    entityIdSecondary?: string,
  ) {
    await client.syncDeletion.create({
      data: {
        userId,
        entityType,
        entityId,
        entityIdSecondary: entityIdSecondary ?? null,
      },
    });
  }

  async logWordBook(client: PrismaClient, userId: string, id: string) {
    await this.log(client, userId, SYNC_DELETION_ENTITY.WORD_BOOK, id);
  }

  async logWord(client: PrismaClient, userId: string, id: string) {
    await this.log(client, userId, SYNC_DELETION_ENTITY.WORD, id);
  }

  async logKanjiBook(client: PrismaClient, userId: string, id: string) {
    await this.log(client, userId, SYNC_DELETION_ENTITY.KANJI_BOOK, id);
  }

  async logKanji(client: PrismaClient, userId: string, id: string) {
    await this.log(client, userId, SYNC_DELETION_ENTITY.KANJI, id);
  }

  async logWordKanji(
    client: PrismaClient,
    userId: string,
    wordId: string,
    kanjiId: string,
  ) {
    await this.log(
      client,
      userId,
      SYNC_DELETION_ENTITY.WORD_KANJI,
      wordId,
      kanjiId,
    );
  }

  async logKanjiKanjiBook(
    client: PrismaClient,
    userId: string,
    kanjiId: string,
    kanjiBookId: string,
  ) {
    await this.log(
      client,
      userId,
      SYNC_DELETION_ENTITY.KANJI_KANJI_BOOK,
      kanjiId,
      kanjiBookId,
    );
  }
}
