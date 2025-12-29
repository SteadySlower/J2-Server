import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DictionaryService } from '../dictionary/dictionary.service';

type DictionarySearchResult = {
  japanese: string;
  meaning: string;
  pronunciation: string;
};

type KanjiSearchResult = {
  meaning: string;
  ondoku: string | null;
  kundoku: string | null;
};

@Injectable()
export class DictionaryApiService {
  constructor(private readonly dictionaryService: DictionaryService) {}

  async searchByJapanese(query: string): Promise<DictionarySearchResult[]> {
    try {
      return await this.dictionaryService.searchByJapanese(query);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('서버 에러가 발생했습니다.');
    }
  }

  async searchByMeaning(query: string): Promise<DictionarySearchResult[]> {
    try {
      return await this.dictionaryService.searchByMeaning(query);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('서버 에러가 발생했습니다.');
    }
  }

  async searchBySound(query: string): Promise<DictionarySearchResult[]> {
    try {
      return await this.dictionaryService.searchBySound(query);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('서버 에러가 발생했습니다.');
    }
  }

  async getPronunciationByJapanese(query: string): Promise<string> {
    try {
      return await this.dictionaryService.getPronunciation(query);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('서버 에러가 발생했습니다.');
    }
  }

  async getKanjiDetail(character: string): Promise<KanjiSearchResult> {
    try {
      return await this.dictionaryService.searchKanji(character);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('서버 에러가 발생했습니다.');
    }
  }
}
