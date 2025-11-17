import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { WordsService } from './words.service';

@Controller('words')
@UseGuards(AuthGuard)
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createWordDto: CreateWordDto,
  ) {
    return this.wordsService.create(user.id, createWordDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateWordDto: UpdateWordDto,
  ) {
    return this.wordsService.update(id, user.id, updateWordDto);
  }
}
