import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaTransactionClient } from '../prisma/prisma.types';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { DictionaryService } from '../dictionary/dictionary.service';
import { extractKanjiCharacters } from '../common/utils/japanese';

@Injectable()
export class WordsService {
  constructor(
    private prisma: PrismaService,
    private dictionaryService: DictionaryService,
  ) {}

  /**
   * 트랜잭션 내에서 사용하는 processKanjisFromJapanese
   * @param tx Prisma 트랜잭션 클라이언트
   * @param japanese 일본어 텍스트
   * @param userId 사용자 ID
   * @returns kanji ID 배열
   */
  private async processKanjisFromJapaneseWithTx(
    tx: PrismaTransactionClient,
    japanese: string,
    userId: string,
  ): Promise<string[]> {
    // 1. japanese에서 한자 추출
    const kanjiCharacters = extractKanjiCharacters(japanese);

    if (kanjiCharacters.length === 0) {
      return [];
    }

    // 2. 사용자의 kanjis에 존재하는지 확인
    const existingKanjis = await tx.kanji.findMany({
      where: {
        userId,
        character: { in: kanjiCharacters },
      },
    });

    const existingCharacters = new Set(
      existingKanjis.map((kanji) => kanji.character),
    );
    const missingCharacters = kanjiCharacters.filter(
      (char) => !existingCharacters.has(char),
    );

    // 3. 존재하지 않는 한자들은 dictionary에서 검색
    if (missingCharacters.length > 0) {
      const dictionaryResults = await Promise.all(
        missingCharacters.map((char) =>
          this.dictionaryService.findKanjiByCharacter(char),
        ),
      );

      // 4. 검색 결과가 있는 한자들은 kanjis에 추가
      const kanjisToCreate = dictionaryResults
        .map((dict, index) => {
          if (!dict) return null;
          return {
            character: missingCharacters[index],
            meaning: dict.meaning,
            onReading: dict.onReading,
            kunReading: dict.kunReading,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (kanjisToCreate.length > 0) {
        // 없는 한자들 생성 (skipDuplicates로 중복 방지)
        await tx.kanji.createManyAndReturn({
          data: kanjisToCreate.map((kanjiData) => ({
            userId,
            character: kanjiData.character,
            meaning: kanjiData.meaning,
            onReading: kanjiData.onReading,
            kunReading: kanjiData.kunReading,
          })),
          skipDuplicates: true,
        });
      }
    }

    // 5. 모든 한자 ID를 한 번에 조회 (동시성 문제 해결)
    const allKanjis = await tx.kanji.findMany({
      where: {
        userId,
        character: { in: kanjiCharacters },
      },
    });

    return allKanjis.map((k) => k.id);
  }

  /**
   * 트랜잭션 내에서 사용하는 createWordKanjiRelationships
   * @param tx Prisma 트랜잭션 클라이언트
   * @param wordId 단어 UUID
   * @param kanjiIds 한자 UUID 배열 (processKanjisFromJapaneseWithTx에서 반환된 것으로, 이미 사용자 소유권이 확인된 한자들)
   */
  private async createWordKanjiRelationshipsWithTx(
    tx: PrismaTransactionClient,
    wordId: string,
    kanjiIds: string[],
  ): Promise<void> {
    // kanjiIds가 비어있으면 아무것도 하지 않음
    if (!kanjiIds || kanjiIds.length === 0) {
      return;
    }

    // 이미 존재하는 관계 확인 (중복 방지)
    const existingRelations = await tx.wordKanji.findMany({
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
    // 참고: kanjiIds는 processKanjisFromJapaneseWithTx에서 반환된 것으로,
    // 이미 사용자 소유권이 확인된 한자들입니다.
    await tx.wordKanji.createMany({
      data: newKanjiIds.map((kanjiId) => ({
        wordId,
        kanjiId,
      })),
      skipDuplicates: true, // 안전장치
    });
  }

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

    // 트랜잭션으로 원자성 보장
    try {
      const word = await this.prisma.$transaction(async (tx) => {
        // 한자 처리 및 kanjis에 추가
        const kanjiIds = await this.processKanjisFromJapaneseWithTx(
          tx,
          japanese,
          userId,
        );

        // 단어 생성
        const createdWord = await tx.word.create({
          data: {
            bookId: book_id,
            japanese,
            meaning,
            pronunciation: pronunciation || null,
          },
        });

        // word_kanji 관계 생성
        if (kanjiIds.length > 0) {
          await this.createWordKanjiRelationshipsWithTx(
            tx,
            createdWord.id,
            kanjiIds,
          );
        }

        return createdWord;
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

    const isJapaneseChanged =
      updateWordDto.japanese !== undefined &&
      updateWordDto.japanese !== word.japanese;

    if (updateWordDto.japanese !== undefined && isJapaneseChanged) {
      // 자기 자신을 제외한 중복 체크
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

      // japanese가 실제로 변경된 경우에만 updateData에 추가
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
      // 트랜잭션으로 원자성 보장
      const updatedWord = await this.prisma.$transaction(async (tx) => {
        // word.update 실행
        const updated = await tx.word.update({
          where: { id },
          data: updateData,
        });

        // japanese가 변경된 경우에만 관계 처리
        if (isJapaneseChanged && updateWordDto.japanese !== undefined) {
          // 새로운 japanese에서 한자 처리
          const newKanjiIds = await this.processKanjisFromJapaneseWithTx(
            tx,
            updateWordDto.japanese,
            userId,
          );

          // 기존 word_kanji 관계 조회
          const existingRelations = await tx.wordKanji.findMany({
            where: { wordId: id },
          });

          const existingKanjiIds = new Set(
            existingRelations.map((rel) => rel.kanjiId),
          );
          const newKanjiIdsSet = new Set(newKanjiIds);

          // 삭제할 관계: 기존에는 있지만 새로운 것에는 없음
          const kanjiIdsToDelete = Array.from(existingKanjiIds).filter(
            (kanjiId) => !newKanjiIdsSet.has(kanjiId),
          );

          // 추가할 관계: 새로운 것에는 있지만 기존에는 없음
          const kanjiIdsToAdd = newKanjiIds.filter(
            (kanjiId) => !existingKanjiIds.has(kanjiId),
          );

          // 삭제할 관계가 있으면 삭제
          if (kanjiIdsToDelete.length > 0) {
            await tx.wordKanji.deleteMany({
              where: {
                wordId: id,
                kanjiId: { in: kanjiIdsToDelete },
              },
            });
          }

          // 추가할 관계가 있으면 생성
          if (kanjiIdsToAdd.length > 0) {
            await tx.wordKanji.createMany({
              data: kanjiIdsToAdd.map((kanjiId) => ({
                wordId: id,
                kanjiId,
              })),
              skipDuplicates: true,
            });
          }
        }

        return updated;
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
}
