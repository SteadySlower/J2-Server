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

    // 이미 같은 character의 Kanji가 존재하는지 확인
    const existingKanji = await this.prisma.kanji.findUnique({
      where: {
        userId_character: {
          userId,
          character,
        },
      },
      include: {
        kanjiBooks: {
          where: kanji_book_id
            ? {
                kanjiBookId: kanji_book_id,
              }
            : undefined,
        },
      },
    });

    // 이미 같은 character의 Kanji가 존재하는 경우
    if (existingKanji) {
      // 한자장이 지정되었고, 이미 같은 관계가 존재하는 경우
      if (kanji_book_id && existingKanji.kanjiBooks.length > 0) {
        throw new BadRequestException(
          '이미 같은 한자 문자가 해당 한자장에 존재합니다.',
        );
      }

      // 한자장이 지정되었지만 관계가 없는 경우, 한자 정보 업데이트 및 관계 추가
      if (kanji_book_id) {
        try {
          // 한자 정보 업데이트
          const updatedKanji = await this.prisma.kanji.update({
            where: { id: existingKanji.id },
            data: {
              meaning,
              onReading: onReadingValue,
              kunReading: kunReadingValue,
            },
          });

          // 관계 추가
          await this.prisma.kanjiKanjiBook.create({
            data: {
              kanjiId: existingKanji.id,
              kanjiBookId: kanji_book_id,
            },
          });

          // 업데이트된 Kanji 반환
          return {
            id: updatedKanji.id,
            character: updatedKanji.character,
            meaning: updatedKanji.meaning,
            on_reading: updatedKanji.onReading,
            kun_reading: updatedKanji.kunReading,
            status: updatedKanji.status,
            created_at: updatedKanji.createdAt.toISOString(),
            updated_at: updatedKanji.updatedAt.toISOString(),
          };
        } catch (relationError: unknown) {
          // 관계 중복 에러 처리 (방어적 프로그래밍)
          if (
            relationError &&
            typeof relationError === 'object' &&
            'code' in relationError &&
            (relationError as { code: string }).code === 'P2002'
          ) {
            throw new BadRequestException(
              '이미 같은 한자 문자가 해당 한자장에 존재합니다.',
            );
          }
          throw relationError;
        }
      }

      // 한자장이 지정되지 않은 경우, 한자 정보만 업데이트
      const updatedKanji = await this.prisma.kanji.update({
        where: { id: existingKanji.id },
        data: {
          meaning,
          onReading: onReadingValue,
          kunReading: kunReadingValue,
        },
      });

      // 업데이트된 Kanji 반환
      return {
        id: updatedKanji.id,
        character: updatedKanji.character,
        meaning: updatedKanji.meaning,
        on_reading: updatedKanji.onReading,
        kun_reading: updatedKanji.kunReading,
        status: updatedKanji.status,
        created_at: updatedKanji.createdAt.toISOString(),
        updated_at: updatedKanji.updatedAt.toISOString(),
      };
    }

    // 새로운 Kanji 생성
    try {
      const kanji = await this.prisma.kanji.create({
        data: {
          userId,
          character,
          meaning,
          onReading: onReadingValue,
          kunReading: kunReadingValue,
          ...(kanji_book_id && {
            kanjiBooks: {
              create: {
                kanjiBookId: kanji_book_id,
              },
            },
          }),
        },
      });

      return {
        id: kanji.id,
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
      meaning?: string;
      onReading?: string | null;
      kunReading?: string | null;
      status?: 'learning' | 'learned';
    } = {};

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
      character: updatedKanji.character,
      meaning: updatedKanji.meaning,
      on_reading: updatedKanji.onReading,
      kun_reading: updatedKanji.kunReading,
      status: updatedKanji.status,
      created_at: updatedKanji.createdAt.toISOString(),
      updated_at: updatedKanji.updatedAt.toISOString(),
    };
  }

  async findWordsByKanji(kanjiId: string, userId: string) {
    // 한자 존재 및 소유권 확인
    const kanji = await this.prisma.kanji.findUnique({
      where: { id: kanjiId },
    });

    if (!kanji) {
      throw new NotFoundException('한자를 찾을 수 없습니다.');
    }

    if (kanji.userId !== userId) {
      throw new ForbiddenException('이 한자에 접근할 권한이 없습니다.');
    }

    // 한자와 연결된 단어를 pronunciation 기준으로 중복 제거하여 조회
    const words = await this.prisma.word.findMany({
      where: {
        kanjis: {
          some: {
            kanjiId,
          },
        },
      },
      select: {
        id: true,
        bookId: true,
        japanese: true,
        meaning: true,
        pronunciation: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      distinct: ['pronunciation'],
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(words);

    return words.map((word) => ({
      id: word.id,
      book_id: word.bookId,
      japanese: word.japanese,
      meaning: word.meaning,
      pronunciation: word.pronunciation,
      status: word.status,
      created_at: word.createdAt.toISOString(),
      updated_at: word.updatedAt.toISOString(),
    }));
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
