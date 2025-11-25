import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PrismaTransactionClient } from '../prisma/prisma.types';

export type DictionaryEntryPayload = {
  japanese: string;
  meaning: string;
  pronunciation: string;
};

type DictionaryRecordId = {
  id: string;
};

@Injectable()
export class DictionaryCacheService {
  constructor(private prisma: PrismaService) {}

  async getCacheByPronunciation(query: string) {
    const cache = await this.prisma.aiCachePronunciation.findUnique({
      where: { queryHash: query },
      include: {
        dictionaries: {
          include: {
            dictionary: true,
          },
        },
      },
    });

    if (!cache || cache.dictionaries.length === 0) {
      return [];
    }

    return cache.dictionaries.map((item) => item.dictionary);
  }

  async getCacheByJapanese(query: string) {
    const cache = await this.prisma.aiCacheJapanese.findUnique({
      where: { queryHash: query },
      include: {
        dictionaries: {
          include: {
            dictionary: true,
          },
        },
      },
    });

    if (!cache || cache.dictionaries.length === 0) {
      return [];
    }

    return cache.dictionaries.map((item) => item.dictionary);
  }

  async getCacheByMeaning(query: string) {
    const cache = await this.prisma.aiCacheMeaning.findUnique({
      where: { queryHash: query },
      include: {
        dictionaries: {
          include: {
            dictionary: true,
          },
        },
      },
    });

    if (!cache || cache.dictionaries.length === 0) {
      return [];
    }

    return cache.dictionaries.map((item) => item.dictionary);
  }

  private async createDictionaryRecords(
    tx: PrismaTransactionClient,
    entries: DictionaryEntryPayload[],
  ): Promise<DictionaryRecordId[]> {
    return await Promise.all(
      entries.map((entry) =>
        tx.dictionary.upsert({
          where: {
            japanese: entry.japanese,
          },
          update: {},
          create: {
            japanese: entry.japanese,
            meaning: entry.meaning,
            pronunciation: entry.pronunciation,
          },
          select: {
            id: true,
          },
        }),
      ),
    );
  }

  async cachePronunciationResults(
    query: string,
    entries: DictionaryEntryPayload[],
  ) {
    if (!query || entries.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.aiCachePronunciation.upsert({
        where: { queryHash: query },
        create: { queryHash: query },
        update: {},
      });

      const dictionaryRecords = await this.createDictionaryRecords(tx, entries);

      await tx.aiCachePronunciationDictionary.createMany({
        data: dictionaryRecords.map((dictionary) => ({
          cacheQueryHash: query,
          dictionaryId: dictionary.id,
        })),
        skipDuplicates: true,
      });
    });
  }

  async cacheJapaneseResults(query: string, entries: DictionaryEntryPayload[]) {
    if (!query || entries.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.aiCacheJapanese.upsert({
        where: { queryHash: query },
        create: { queryHash: query },
        update: {},
      });

      const dictionaryRecords = await this.createDictionaryRecords(tx, entries);

      await tx.aiCacheJapaneseDictionary.createMany({
        data: dictionaryRecords.map((dictionary) => ({
          cacheQueryHash: query,
          dictionaryId: dictionary.id,
        })),
        skipDuplicates: true,
      });
    });
  }

  async cacheMeaningResults(query: string, entries: DictionaryEntryPayload[]) {
    if (!query || entries.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.aiCacheMeaning.upsert({
        where: { queryHash: query },
        create: { queryHash: query },
        update: {},
      });

      const dictionaryRecords = await this.createDictionaryRecords(tx, entries);

      await tx.aiCacheMeaningDictionary.createMany({
        data: dictionaryRecords.map((dictionary) => ({
          cacheQueryHash: query,
          dictionaryId: dictionary.id,
        })),
        skipDuplicates: true,
      });
    });
  }
}
