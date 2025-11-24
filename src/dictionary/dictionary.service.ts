import { Injectable } from '@nestjs/common';
import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DictionaryService {
  private kuroshiro: Kuroshiro | null = null;

  constructor(private prisma: PrismaService) {}

  private async getKuroshiroInstance() {
    if (!this.kuroshiro) {
      this.kuroshiro = new Kuroshiro();
      await this.kuroshiro.init(new KuromojiAnalyzer());
    }

    return this.kuroshiro;
  }

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

  async getKanjiToJp(word: string): Promise<string | null> {
    if (!word) {
      return null;
    }

    const kuroshiro = await this.getKuroshiroInstance();
    const result = await kuroshiro.convert(word, {
      mode: 'furigana',
      to: 'hiragana',
    });

    return result;
  }
}
