import { Injectable } from '@nestjs/common';
import { DictionaryService } from '../dictionary/dictionary.service';

@Injectable()
export class DictionaryApiService {
  constructor(private readonly dictionaryService: DictionaryService) {}

  searchByJapanese(query: string) {
    void query;
    return {
      ok: true,
      data: null,
    };
  }

  searchByKorean(query: string) {
    void query;
    // TODO: implement search logic that supports multiple query types
    return {
      ok: true,
      data: null,
    };
  }

  searchBySound(query: string) {
    void query;
    // TODO: implement search logic that supports multiple query types
    return {
      ok: true,
      data: null,
    };
  }

  private async getKanjiToJp(word: string): Promise<string | null> {
    return await this.dictionaryService.getKanjiToJp(word);
  }
}
