import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';

@Injectable()
export class WordsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 단어를 조회하고 소유권을 확인하는 헬퍼 메서드
   */
  private async findWordWithOwnershipCheck(id: string, userId: string) {
    const word = await this.prisma.word.findUnique({
      where: { id },
      include: {
        book: true,
      },
    });

    if (!word) {
      throw new NotFoundException('단어를 찾을 수 없습니다.');
    }

    if (word.book.userId !== userId) {
      throw new ForbiddenException('이 단어에 접근할 권한이 없습니다.');
    }

    return word;
  }

  async create(userId: string, createWordDto: CreateWordDto) {
    if (!createWordDto) {
      throw new BadRequestException('요청 본문이 필요합니다.');
    }

    const { book_id, japanese, meaning, pronunciation } = createWordDto;

    // 단어장 존재 및 소유권 확인
    const wordBook = await this.prisma.wordBook.findUnique({
      where: { id: book_id },
    });

    if (!wordBook) {
      throw new NotFoundException('단어장을 찾을 수 없습니다.');
    }

    if (wordBook.userId !== userId) {
      throw new ForbiddenException('이 단어장에 접근할 권한이 없습니다.');
    }

    // 단어 생성
    try {
      const word = await this.prisma.word.create({
        data: {
          bookId: book_id,
          japanese,
          meaning,
          pronunciation: pronunciation || null,
        },
      });

      return {
        id: word.id,
        book_id: word.bookId,
        japanese: word.japanese,
        meaning: word.meaning,
        pronunciation: word.pronunciation,
        status: word.status,
        created_at: word.createdAt.toISOString(),
        updated_at: word.updatedAt.toISOString(),
      };
    } catch (error: unknown) {
      // Prisma unique constraint violation (P2002)
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new BadRequestException(
          '이 단어장에 이미 같은 일본어 단어가 존재합니다.',
        );
      }
      throw error;
    }
  }

  async update(id: string, userId: string, updateWordDto: UpdateWordDto) {
    // 단어 존재 및 소유권 확인 (단어장을 통해)
    const word = await this.findWordWithOwnershipCheck(id, userId);

    const updateData: {
      japanese?: string;
      meaning?: string;
      pronunciation?: string | null;
      status?: 'learning' | 'learned';
    } = {};

    if (updateWordDto.japanese !== undefined) {
      // 자기 자신을 제외한 중복 체크
      if (updateWordDto.japanese !== word.japanese) {
        const existingWord = await this.prisma.word.findFirst({
          where: {
            bookId: word.bookId,
            japanese: updateWordDto.japanese,
            id: { not: id }, // 자기 자신 제외
          },
        });

        if (existingWord) {
          throw new BadRequestException(
            '이 단어장에 이미 같은 일본어 단어가 존재합니다.',
          );
        }
      }
      updateData.japanese = updateWordDto.japanese;
    }
    if (updateWordDto.meaning !== undefined) {
      updateData.meaning = updateWordDto.meaning;
    }
    if (updateWordDto.pronunciation !== undefined) {
      updateData.pronunciation = updateWordDto.pronunciation || null;
    }
    if (updateWordDto.status !== undefined) {
      updateData.status = updateWordDto.status;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('수정할 필드가 없습니다.');
    }

    try {
      const updatedWord = await this.prisma.word.update({
        where: { id },
        data: updateData,
      });

      return {
        id: updatedWord.id,
        book_id: updatedWord.bookId,
        japanese: updatedWord.japanese,
        meaning: updatedWord.meaning,
        pronunciation: updatedWord.pronunciation,
        status: updatedWord.status,
        created_at: updatedWord.createdAt.toISOString(),
        updated_at: updatedWord.updatedAt.toISOString(),
      };
    } catch (error: unknown) {
      // Prisma unique constraint violation (P2002)
      // japanese를 수정할 때 같은 단어장에 중복이 발생할 수 있음
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new BadRequestException(
          '이 단어장에 이미 같은 일본어 단어가 존재합니다.',
        );
      }
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    // 단어 존재 및 소유권 확인 (단어장을 통해)
    await this.findWordWithOwnershipCheck(id, userId);

    await this.prisma.word.delete({
      where: { id },
    });

    return {
      message: '단어가 성공적으로 삭제되었습니다.',
    };
  }

  /**
   * Word와 Kanji 간의 관계를 생성
   * @param wordId 단어 UUID
   * @param kanjiIds 한자 UUID 배열
   * @param userId 사용자 UUID (소유권 확인용)
   */
  async createWordKanjiRelationships(
    wordId: string,
    kanjiIds: string[],
    userId: string,
  ): Promise<void> {
    // Word 존재 및 소유권 확인
    await this.findWordWithOwnershipCheck(wordId, userId);

    // kanjiIds가 비어있으면 아무것도 하지 않음
    if (!kanjiIds || kanjiIds.length === 0) {
      return;
    }

    // 각 Kanji 존재 및 소유권 확인
    const kanjis = await this.prisma.kanji.findMany({
      where: {
        id: { in: kanjiIds },
      },
    });

    if (kanjis.length !== kanjiIds.length) {
      throw new NotFoundException('일부 한자를 찾을 수 없습니다.');
    }

    // 모든 Kanji가 사용자 소유인지 확인
    const invalidKanji = kanjis.find((kanji) => kanji.userId !== userId);
    if (invalidKanji) {
      throw new ForbiddenException('일부 한자에 접근할 권한이 없습니다.');
    }

    // 이미 존재하는 관계 확인 (중복 방지)
    const existingRelations = await this.prisma.wordKanji.findMany({
      where: {
        wordId,
        kanjiId: { in: kanjiIds },
      },
    });

    const existingKanjiIds = new Set(
      existingRelations.map((rel) => rel.kanjiId),
    );

    // 새로 생성할 관계만 필터링
    const newKanjiIds = kanjiIds.filter(
      (kanjiId) => !existingKanjiIds.has(kanjiId),
    );

    if (newKanjiIds.length === 0) {
      // 이미 모든 관계가 존재함
      return;
    }

    // 배치 생성
    try {
      await this.prisma.wordKanji.createMany({
        data: newKanjiIds.map((kanjiId) => ({
          wordId,
          kanjiId,
        })),
        skipDuplicates: true, // 안전장치
      });
    } catch (error: unknown) {
      // Prisma unique constraint violation (P2002)
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        // skipDuplicates를 사용했으므로 이 에러는 발생하지 않아야 하지만 안전장치
        throw new BadRequestException('이미 존재하는 관계가 있습니다.');
      }
      throw error;
    }
  }
}
