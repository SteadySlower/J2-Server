import { Inject, Injectable } from '@nestjs/common';
import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import { PrismaService } from '../prisma/prisma.service';
import type { PrismaTransactionClient } from '../prisma/prisma.types';
import type { IAiService } from '../openAi/ai.interface';

type DictionaryEntryPayload = {
  japanese: string;
  meaning: string;
  pronunciation: string;
};
type DictionaryRecordId = {
  id: string;
};

@Injectable()
export class DictionaryService {
  private kuroshiro: Kuroshiro | null = null;

  constructor(
    private prisma: PrismaService,
    @Inject('AI_SERVICE') private aiService: IAiService,
  ) {}

  private async getKuroshiroInstance() {
    if (!this.kuroshiro) {
      this.kuroshiro = new Kuroshiro();
      await this.kuroshiro.init(new KuromojiAnalyzer());
    }

    return this.kuroshiro;
  }

  /**
   * 한자 문자로 kanji_dictionary에서 검색
   * @param character 한자 문자 (정확히 1자)
   * @returns KanjiDictionary 정보 또는 null
   */
  async findKanjiByCharacter(character: string) {
    if (!character || character.length !== 1) {
      return null;
    }

    return await this.prisma.kanjiDictionary.findUnique({
      where: {
        character,
      },
    });
  }

  async getPronunciation(word: string): Promise<string> {
    if (!word) {
      return '';
    }

    const cached = await this.prisma.dictionary.findUnique({
      where: { japanese: word },
      select: { pronunciation: true },
    });
    if (cached && cached.pronunciation) {
      return cached.pronunciation;
    }

    const kuroshiro = await this.getKuroshiroInstance();
    const result = await kuroshiro.convert(word, {
      mode: 'furigana',
      to: 'hiragana',
    });

    return result;
  }

  async getMeanings(word: string): Promise<string[]> {
    const cached = await this.prisma.dictionary.findUnique({
      where: { japanese: word },
      select: { meaning: true },
    });

    if (cached && cached.meaning) {
      return cached.meaning.split(', ');
    }

    const meanings = await this.aiService.getMeaningsByWord(word);
    return meanings;
  }

  async searchWithMeaning(query: string): Promise<string[]> {
    const words = await this.aiService.getWordsByMeaning(query);
    return words;
  }

  async searchWithPronunciation(query: string): Promise<string[]> {
    const words = await this.aiService.getWordsByPronunciation(query);
    return words;
  }

  async getPronunciationCache(query: string) {
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

  async getJapaneseCache(query: string) {
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

  async getMeaningCache(query: string) {
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
