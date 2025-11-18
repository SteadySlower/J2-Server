import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DictionaryService {
  constructor(private prisma: PrismaService) {}

  /**
   * 한자 문자로 kanji_dictionary에서 검색
   * @param character 한자 문자 (정확히 1자)
   * @returns KanjiDictionary 정보 또는 null
   */
  async findKanjiByCharacter(character: string) {
    if (!character || character.length !== 1) {
      return null;
    }

    return await this.prisma.kanjiDictionary.findUnique({
      where: {
        character,
      },
    });
  }
}
