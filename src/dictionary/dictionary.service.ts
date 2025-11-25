import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import { PrismaService } from '../prisma/prisma.service';
import type { IAiService } from '../openAi/ai.interface';
import { DictionaryCacheService } from './dictionary-cache.service';

type DictionarySearchResult = {
  japanese: string;
  meaning: string;
  pronunciation: string;
};

@Injectable()
export class DictionaryService {
  private kuroshiro: Kuroshiro | null = null;

  constructor(
    private prisma: PrismaService,
    @Inject('AI_SERVICE') private aiService: IAiService,
    private cacheService: DictionaryCacheService,
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

  // jp를 가져오는 private 함수가 없는 것은 jp의 경우는 cache table에 없으면 무조건 ai를 사용해야 하기 때문이다.
  // 그러나 meaning이나 pronunciation은 ai로 jp를 찾은 이후에는 같은 jp가 dictionary에 있을 가능성이 존재한다.
  private async getMeanings(word: string): Promise<string[]> {
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

  private async getPronunciation(word: string): Promise<string> {
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

  async searchByJapanese(query: string): Promise<DictionarySearchResult[]> {
    const cached = await this.cacheService.getCacheByJapanese(query);
    if (cached.length > 0) {
      return cached.map((entry) => ({
        japanese: entry.japanese,
        meaning: entry.meaning,
        pronunciation: entry.pronunciation ?? '',
      }));
    }

    const meanings = await this.getMeanings(query);

    if (!meanings || meanings.length === 0) {
      throw new NotFoundException('검색 결과를 찾을 수 없습니다.');
    }

    const pronunciation = await this.getPronunciation(query);

    const result: DictionarySearchResult[] = [
      {
        japanese: query,
        meaning: meanings.join(', '),
        pronunciation: pronunciation,
      },
    ];

    await this.cacheService.cacheJapaneseResults(query, result);

    return result;
  }

  async searchByMeaning(query: string): Promise<DictionarySearchResult[]> {
    const cached = await this.cacheService.getCacheByMeaning(query);
    if (cached.length > 0) {
      return cached.map((entry) => ({
        japanese: entry.japanese,
        meaning: entry.meaning,
        pronunciation: entry.pronunciation ?? '',
      }));
    }

    const japaneseWords = await this.aiService.getWordsByMeaning(query);

    if (japaneseWords.length === 0) {
      throw new NotFoundException('검색 결과를 찾을 수 없습니다.');
    }

    const results = await Promise.all(
      japaneseWords.map(async (jp) => {
        const [meaningsFromDictionary, pronunciationFromDictionary] =
          await Promise.all([this.getMeanings(jp), this.getPronunciation(jp)]);

        let meanings = meaningsFromDictionary;
        if (!meanings.includes(query)) {
          meanings = [query, ...meanings];
        }

        return {
          japanese: jp,
          meaning: meanings.join(', '),
          pronunciation: pronunciationFromDictionary,
        };
      }),
    );

    await this.cacheService.cacheMeaningResults(query, results);

    return results;
  }

  async searchBySound(query: string): Promise<DictionarySearchResult[]> {
    const cached = await this.cacheService.getCacheByPronunciation(query);
    if (cached.length > 0) {
      return cached.map((entry) => ({
        japanese: entry.japanese,
        meaning: entry.meaning,
        pronunciation: entry.pronunciation ?? '',
      }));
    }

    const japaneseWords = await this.aiService.getWordsByPronunciation(query);

    if (japaneseWords.length === 0) {
      throw new NotFoundException('검색 결과를 찾을 수 없습니다.');
    }

    const results = await Promise.all(
      japaneseWords.map(async (jp) => {
        const [meanings, pronunciation] = await Promise.all([
          this.getMeanings(jp),
          this.getPronunciation(jp),
        ]);

        return {
          japanese: jp,
          meaning: meanings.join(', '),
          pronunciation: pronunciation,
        };
      }),
    );

    await this.cacheService.cachePronunciationResults(query, results);

    return results;
  }
}
