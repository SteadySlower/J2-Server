import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKanjiDto } from './dto/create-kanji.dto';
import { UpdateKanjiDto } from './dto/update-kanji.dto';

@Injectable()
export class KanjisService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const kanjis = await this.prisma.kanji.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return kanjis.map((kanji) => ({
      id: kanji.id,
      kanji_book_id: kanji.kanjiBookId,
      character: kanji.character,
      meaning: kanji.meaning,
      on_reading: kanji.onReading,
      kun_reading: kanji.kunReading,
      status: kanji.status,
      created_at: kanji.createdAt.toISOString(),
      updated_at: kanji.updatedAt.toISOString(),
    }));
  }

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

  async update(id: string, userId: string, updateKanjiDto: UpdateKanjiDto) {
    // 한자 존재 및 소유권 확인
    const kanji = await this.prisma.kanji.findUnique({
      where: { id },
    });

    if (!kanji) {
      throw new NotFoundException('한자를 찾을 수 없습니다.');
    }

    if (kanji.userId !== userId) {
      throw new ForbiddenException('이 한자에 접근할 권한이 없습니다.');
    }

    const updateData: {
      kanjiBookId?: string | null;
      meaning?: string;
      onReading?: string | null;
      kunReading?: string | null;
      status?: 'learning' | 'learned';
    } = {};

    // 한자장 변경 처리
    if (updateKanjiDto.kanji_book_id !== undefined) {
      if (updateKanjiDto.kanji_book_id === null) {
        // null로 설정하면 한자장에서 제거
        updateData.kanjiBookId = null;
      } else {
        // 한자장 존재 및 소유권 확인
        const kanjiBook = await this.prisma.kanjiBook.findUnique({
          where: { id: updateKanjiDto.kanji_book_id },
        });

        if (!kanjiBook) {
          throw new NotFoundException('한자장을 찾을 수 없습니다.');
        }

        if (kanjiBook.userId !== userId) {
          throw new ForbiddenException('이 한자장에 접근할 권한이 없습니다.');
        }

        updateData.kanjiBookId = updateKanjiDto.kanji_book_id;
      }
    }

    if (updateKanjiDto.meaning !== undefined) {
      updateData.meaning = updateKanjiDto.meaning;
    }
    if (updateKanjiDto.on_reading !== undefined) {
      // 빈 문자열을 null로 변환
      updateData.onReading =
        updateKanjiDto.on_reading && updateKanjiDto.on_reading.trim() !== ''
          ? updateKanjiDto.on_reading.trim()
          : null;
    }
    if (updateKanjiDto.kun_reading !== undefined) {
      // 빈 문자열을 null로 변환
      updateData.kunReading =
        updateKanjiDto.kun_reading && updateKanjiDto.kun_reading.trim() !== ''
          ? updateKanjiDto.kun_reading.trim()
          : null;
    }
    if (updateKanjiDto.status !== undefined) {
      updateData.status = updateKanjiDto.status;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('수정할 필드가 없습니다.');
    }

    const updatedKanji = await this.prisma.kanji.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updatedKanji.id,
      kanji_book_id: updatedKanji.kanjiBookId,
      character: updatedKanji.character,
      meaning: updatedKanji.meaning,
      on_reading: updatedKanji.onReading,
      kun_reading: updatedKanji.kunReading,
      status: updatedKanji.status,
      created_at: updatedKanji.createdAt.toISOString(),
      updated_at: updatedKanji.updatedAt.toISOString(),
    };
  }

  async remove(id: string, userId: string) {
    // 한자 존재 및 소유권 확인
    const kanji = await this.prisma.kanji.findUnique({
      where: { id },
    });

    if (!kanji) {
      throw new NotFoundException('한자를 찾을 수 없습니다.');
    }

    if (kanji.userId !== userId) {
      throw new ForbiddenException('이 한자에 접근할 권한이 없습니다.');
    }

    try {
      await this.prisma.kanji.delete({
        where: { id },
      });
    } catch (error: unknown) {
      // Prisma foreign key constraint violation (P2003)
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2003'
      ) {
        throw new BadRequestException(
          '이 한자를 사용하는 단어가 있어 삭제할 수 없습니다.',
        );
      }
      throw error;
    }

    return {
      message: '한자가 성공적으로 삭제되었습니다.',
    };
  }
}
