import {
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

@Injectable()
export class DictionaryApiService {
  constructor(private readonly dictionaryService: DictionaryService) {}

  async searchByJapanese(query: string): Promise<DictionarySearchResult[]> {
    try {
      return await this.dictionaryService.searchByJapanese(query);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === '검색 결과를 찾을 수 없습니다.'
      ) {
        throw new NotFoundException('검색 결과를 찾을 수 없습니다.');
      }
      throw new InternalServerErrorException('서버 에러가 발생했습니다.');
    }
  }

  async searchByMeaning(query: string): Promise<DictionarySearchResult[]> {
    try {
      return await this.dictionaryService.searchByMeaning(query);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === '검색 결과를 찾을 수 없습니다.'
      ) {
        throw new NotFoundException('검색 결과를 찾을 수 없습니다.');
      }
      throw new InternalServerErrorException('서버 에러가 발생했습니다.');
    }
  }

  async searchBySound(query: string): Promise<DictionarySearchResult[]> {
    try {
      return await this.dictionaryService.searchBySound(query);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === '검색 결과를 찾을 수 없습니다.'
      ) {
        throw new NotFoundException('검색 결과를 찾을 수 없습니다.');
      }
      throw new InternalServerErrorException('서버 에러가 발생했습니다.');
    }
  }
}
