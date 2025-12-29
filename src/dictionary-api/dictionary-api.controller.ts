import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DictionaryApiService } from './dictionary-api.service';
import { AuthGuard } from '../auth/auth.guard';
import {
  KoSearchQueryDto,
  JpSearchQueryDto,
  KanjiSearchQueryDto,
} from './dto/search-query.dto';

@Controller('dictionary')
@UseGuards(AuthGuard)
export class DictionaryApiController {
  constructor(private readonly dictionaryApiService: DictionaryApiService) {}

  @Get('jp')
  async searchByJapanese(@Query() query: JpSearchQueryDto) {
    return await this.dictionaryApiService.searchByJapanese(query.query);
  }

  @Get('meaning')
  async searchByMeaning(@Query() query: KoSearchQueryDto) {
    return await this.dictionaryApiService.searchByMeaning(query.query);
  }

  @Get('sound')
  async searchBySound(@Query() query: KoSearchQueryDto) {
    return await this.dictionaryApiService.searchBySound(query.query);
  }

  @Get('pronunciation')
  async getPronunciationByJapanese(@Query() query: JpSearchQueryDto) {
    return await this.dictionaryApiService.getPronunciationByJapanese(
      query.query,
    );
  }

  @Get('kanji')
  async getKanjiDetail(@Query() query: KanjiSearchQueryDto) {
    return await this.dictionaryApiService.getKanjiDetail(query.character);
  }
}
