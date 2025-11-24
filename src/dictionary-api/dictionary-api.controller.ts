import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DictionaryApiService } from './dictionary-api.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('dictionary')
@UseGuards(AuthGuard)
export class DictionaryApiController {
  constructor(private readonly dictionaryApiService: DictionaryApiService) {}

  @Get('jp')
  searchByJapanese(@Query('query') query: string) {
    return this.dictionaryApiService.searchByJapanese(query);
  }

  @Get('meaning')
  searchByMeaning(@Query('query') query: string) {
    return this.dictionaryApiService.searchByMeaning(query);
  }

  @Get('sound')
  searchBySound(@Query('query') query: string) {
    return this.dictionaryApiService.searchBySound(query);
  }
}
