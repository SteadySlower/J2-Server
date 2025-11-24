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
    const meaning = await this.dictionaryService.getMeaning(query);

    if (!meaning) {
      throw new NotFoundException('검색 결과를 찾을 수 없습니다.');
    }

    const pronunciation = await this.dictionaryService.getPronunciation(query);

    return [
      {
        japanese: query,
        meaning: meaning,
        pronunciation: pronunciation,
      },
    ];
  }

  async searchByMeaning(query: string): Promise<DictionarySearchResult[]> {
    const japaneseWords = await this.dictionaryService.searchWords(query);

    if (japaneseWords.length === 0) {
      throw new NotFoundException('검색 결과를 찾을 수 없습니다.');
    }

    const results = await Promise.all(
      japaneseWords.map(async (jp) => ({
        japanese: jp,
        meaning: query,
        pronunciation: await this.dictionaryService.getPronunciation(jp),
      })),
    );

    return results;
  }

  async searchBySound(query: string): Promise<DictionarySearchResult[]> {
    const japaneseWords = await this.dictionaryService.searchWords(query);

    if (japaneseWords.length === 0) {
      throw new NotFoundException('검색 결과를 찾을 수 없습니다.');
    }

    const results = await Promise.all(
      japaneseWords.map(async (jp) => ({
        japanese: jp,
        meaning: await this.dictionaryService.getMeaning(jp),
        pronunciation: await this.dictionaryService.getPronunciation(jp),
      })),
    );

    return results;
  }
}
