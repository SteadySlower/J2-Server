import { Injectable, NotFoundException } from '@nestjs/common';
import { DictionaryService } from '../dictionary/dictionary.service';

type DictionarySearchResult = {
  japanese: string;
  meaning: string;
  pronunciation: string;
};

@Injectable()
export class DictionaryApiService {
  constructor(private readonly dictionaryService: DictionaryService) {}

  async searchByJapanese(query: string): Promise<DictionarySearchResult[]> {
    const cached = await this.dictionaryService.getJapaneseCache(query);
    if (cached.length > 0) {
      return cached.map((entry) => ({
        japanese: entry.japanese,
        meaning: entry.meaning,
        pronunciation: entry.pronunciation ?? '',
      }));
    }

    const meanings = await this.dictionaryService.getMeanings(query);

    if (!meanings) {
      throw new NotFoundException('검색 결과를 찾을 수 없습니다.');
    }

    const pronunciation = await this.dictionaryService.getPronunciation(query);

    const result: DictionarySearchResult[] = [
      {
        japanese: query,
        meaning: meanings.join(', '),
        pronunciation: pronunciation,
      },
    ];

    await this.dictionaryService.cacheJapaneseResults(query, result);

    return result;
  }

  async searchByMeaning(query: string): Promise<DictionarySearchResult[]> {
    const cached = await this.dictionaryService.getMeaningCache(query);
    if (cached.length > 0) {
      return cached.map((entry) => ({
        japanese: entry.japanese,
        meaning: entry.meaning,
        pronunciation: entry.pronunciation ?? '',
      }));
    }

    const japaneseWords = await this.dictionaryService.searchWithMeaning(query);

    if (japaneseWords.length === 0) {
      throw new NotFoundException('검색 결과를 찾을 수 없습니다.');
    }

    const results = await Promise.all(
      japaneseWords.map(async (jp) => {
        let meaningsFromDictionary =
          await this.dictionaryService.getMeanings(jp);
        if (!meaningsFromDictionary.includes(query)) {
          meaningsFromDictionary = [query, ...meaningsFromDictionary];
        }
        const pronunciationFromDictionary =
          await this.dictionaryService.getPronunciation(jp);
        return {
          japanese: jp,
          meaning: meaningsFromDictionary.join(', '),
          pronunciation: pronunciationFromDictionary,
        };
      }),
    );

    await this.dictionaryService.cacheMeaningResults(query, results);

    return results;
  }

  async searchBySound(query: string): Promise<DictionarySearchResult[]> {
    const cached = await this.dictionaryService.getPronunciationCache(query);
    if (cached.length > 0) {
      return cached.map((entry) => ({
        japanese: entry.japanese,
        meaning: entry.meaning,
        pronunciation: entry.pronunciation ?? '',
      }));
    }

    const japaneseWords =
      await this.dictionaryService.searchWithPronunciation(query);

    if (japaneseWords.length === 0) {
      throw new NotFoundException('검색 결과를 찾을 수 없습니다.');
    }

    const results = await Promise.all(
      japaneseWords.map(async (jp) => ({
        japanese: jp,
        meaning: (await this.dictionaryService.getMeanings(jp)).join(', '),
        pronunciation: await this.dictionaryService.getPronunciation(jp),
      })),
    );

    await this.dictionaryService.cachePronunciationResults(query, results);

    return results;
  }
}
