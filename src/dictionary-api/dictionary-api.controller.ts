import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DictionaryApiService } from './dictionary-api.service';
import { AuthGuard } from '../auth/auth.guard';
import { KoSearchQueryDto, JpSearchQueryDto } from './dto/search-query.dto';

@Controller('dictionary')
@UseGuards(AuthGuard)
export class DictionaryApiController {
  constructor(private readonly dictionaryApiService: DictionaryApiService) {}

  @Get('jp')
  searchByJapanese(@Query() query: JpSearchQueryDto) {
    return this.dictionaryApiService.searchByJapanese(query.query);
  }

  @Get('meaning')
  searchByMeaning(@Query() query: KoSearchQueryDto) {
    return this.dictionaryApiService.searchByMeaning(query.query);
  }

  @Get('sound')
  searchBySound(@Query() query: KoSearchQueryDto) {
    return this.dictionaryApiService.searchBySound(query.query);
  }
}
