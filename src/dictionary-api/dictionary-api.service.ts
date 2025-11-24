import { Injectable } from '@nestjs/common';
import { DictionaryService } from '../dictionary/dictionary.service';

export type DictionarySearchResult = {
  japanese: string;
  meaning: string;
  pronunciation: string;
};

@Injectable()
export class DictionaryApiService {
  constructor(private readonly dictionaryService: DictionaryService) {}

  searchByJapanese(query: string): DictionarySearchResult[] {
    return [
      {
        japanese: query,
        meaning: 'meaning',
        pronunciation: 'pronunciation',
      },
    ];
  }

  searchByKorean(query: string): DictionarySearchResult[] {
    return [
      {
        japanese: 'japanese',
        meaning: query,
        pronunciation: 'pronunciation',
      },
    ];
  }

  searchBySound(query: string): DictionarySearchResult[] {
    return [
      {
        japanese: 'japanese',
        meaning: 'meaning',
        pronunciation: query,
      },
    ];
  }
}
