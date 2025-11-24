import { Controller, Get, Query } from '@nestjs/common';
import { DictionaryApiService } from './dictionary-api.service';

@Controller('dictionary')
export class DictionaryApiController {
  constructor(private readonly dictionaryApiService: DictionaryApiService) {}

  @Get('')
  search(
    @Query('query') query: string,
    @Query('type') type: 'jp' | 'kr' | 'sound',
  ) {
    switch (type) {
      case 'jp':
        return this.dictionaryApiService.searchByJapanese(query);
      case 'kr':
        return this.dictionaryApiService.searchByKorean(query);
      case 'sound':
        return this.dictionaryApiService.searchBySound(query);
    }
  }
}
