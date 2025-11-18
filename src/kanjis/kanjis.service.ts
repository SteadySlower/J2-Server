import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKanjiDto } from './dto/create-kanji.dto';

@Injectable()
export class KanjisService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createKanjiDto: CreateKanjiDto) {
    if (!createKanjiDto) {
      throw new BadRequestException('요청 본문이 필요합니다.');
    }

    const { kanji_book_id, character, meaning, on_reading, kun_reading } =
      createKanjiDto;

    // 한자장이 지정된 경우 존재 및 소유권 확인
    if (kanji_book_id) {
      const kanjiBook = await this.prisma.kanjiBook.findUnique({
        where: { id: kanji_book_id },
      });

      if (!kanjiBook) {
        throw new NotFoundException('한자장을 찾을 수 없습니다.');
      }

      if (kanjiBook.userId !== userId) {
        throw new ForbiddenException('이 한자노트에 접근할 권한이 없습니다.');
      }
    }

    // 빈 문자열을 null로 변환
    const onReadingValue =
      on_reading && on_reading.trim() !== '' ? on_reading.trim() : null;
    const kunReadingValue =
      kun_reading && kun_reading.trim() !== '' ? kun_reading.trim() : null;

    // 한자 생성
    try {
      const kanji = await this.prisma.kanji.create({
        data: {
          userId,
          kanjiBookId: kanji_book_id || null,
          character,
          meaning,
          onReading: onReadingValue,
          kunReading: kunReadingValue,
        },
      });

      return {
        id: kanji.id,
        kanji_book_id: kanji.kanjiBookId,
        character: kanji.character,
        meaning: kanji.meaning,
        on_reading: kanji.onReading,
        kun_reading: kanji.kunReading,
        status: kanji.status,
        created_at: kanji.createdAt.toISOString(),
        updated_at: kanji.updatedAt.toISOString(),
      };
    } catch (error: unknown) {
      // Prisma unique constraint violation (P2002)
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new BadRequestException('이미 같은 한자 문자가 존재합니다.');
      }
      throw error;
    }
  }
}
