import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWordBookDto } from './dto/create-word-book.dto';
import { UpdateWordBookDto } from './dto/update-word-book.dto';
import { MoveWordsDto } from './dto/move-words.dto';

@Injectable()
export class WordBooksService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return await this.prisma.wordBook.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const wordBook = await this.prisma.wordBook.findUnique({
      where: { id },
      include: {
        words: {
          include: {
            kanjis: {
              include: {
                kanji: true, // ← 추가: kanji 정보 포함
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!wordBook) {
      throw new NotFoundException('단어장을 찾을 수 없습니다.');
    }

    if (wordBook.userId !== userId) {
      throw new ForbiddenException('이 단어장에 접근할 권한이 없습니다.');
    }

    return {
      id: wordBook.id,
      title: wordBook.title,
      status: wordBook.status,
      showFront: wordBook.showFront,
      created_at: wordBook.createdAt.toISOString(),
      updated_at: wordBook.updatedAt.toISOString(),
      words: wordBook.words.map((word) => ({
        id: word.id,
        japanese: word.japanese,
        meaning: word.meaning,
        pronunciation: word.pronunciation,
        status: word.status,
        created_at: word.createdAt.toISOString(),
        updated_at: word.updatedAt.toISOString(),
        kanjis: word.kanjis.map((wordKanji) => ({
          id: wordKanji.kanji.id,
          character: wordKanji.kanji.character,
          meaning: wordKanji.kanji.meaning,
          on_reading: wordKanji.kanji.onReading,
          kun_reading: wordKanji.kanji.kunReading,
          status: wordKanji.kanji.status,
        })),
      })),
    };
  }

  async create(userId: string, createWordBookDto: CreateWordBookDto) {
    if (!createWordBookDto) {
      throw new BadRequestException('요청 본문이 필요합니다.');
    }

    const { title, showFront = true, created_date } = createWordBookDto;

    return await this.prisma.wordBook.create({
      data: {
        userId,
        title,
        showFront,
        createdDate: created_date,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    updateWordBookDto: UpdateWordBookDto,
  ) {
    const wordBook = await this.prisma.wordBook.findUnique({
      where: { id },
    });

    if (!wordBook) {
      throw new NotFoundException('단어장을 찾을 수 없습니다.');
    }

    if (wordBook.userId !== userId) {
      throw new ForbiddenException('이 단어장에 접근할 권한이 없습니다.');
    }

    const updateData: {
      title?: string;
      status?: 'studying' | 'studied';
      showFront?: boolean;
    } = {};

    if (updateWordBookDto.title !== undefined) {
      updateData.title = updateWordBookDto.title;
    }
    if (updateWordBookDto.status !== undefined) {
      updateData.status = updateWordBookDto.status;
    }
    if (updateWordBookDto.showFront !== undefined) {
      updateData.showFront = updateWordBookDto.showFront;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('수정할 필드가 없습니다.');
    }

    return await this.prisma.wordBook.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, userId: string) {
    const wordBook = await this.prisma.wordBook.findUnique({
      where: { id },
    });

    if (!wordBook) {
      throw new NotFoundException('단어장을 찾을 수 없습니다.');
    }

    if (wordBook.userId !== userId) {
      throw new ForbiddenException('이 단어장에 접근할 권한이 없습니다.');
    }

    await this.prisma.wordBook.delete({
      where: { id },
    });

    return {
      message: '단어장이 성공적으로 삭제되었습니다.',
    };
  }

  async moveWords(
    sourceBookId: string,
    userId: string,
    moveWordsDto: MoveWordsDto,
  ) {
    const { target_book_id, word_ids } = moveWordsDto;

    // 소스 단어장과 타겟 단어장이 같은 경우
    if (sourceBookId === target_book_id) {
      throw new BadRequestException(
        '소스 단어장과 타겟 단어장이 같을 수 없습니다.',
      );
    }

    // 소스 단어장 존재 및 소유권 확인
    const sourceWordBook = await this.prisma.wordBook.findUnique({
      where: { id: sourceBookId },
    });

    if (!sourceWordBook) {
      throw new NotFoundException('소스 단어장을 찾을 수 없습니다.');
    }

    if (sourceWordBook.userId !== userId) {
      throw new ForbiddenException('소스 단어장에 접근할 권한이 없습니다.');
    }

    // 타겟 단어장 존재 및 소유권 확인
    const targetWordBook = await this.prisma.wordBook.findUnique({
      where: { id: target_book_id },
    });

    if (!targetWordBook) {
      throw new NotFoundException('타겟 단어장을 찾을 수 없습니다.');
    }

    if (targetWordBook.userId !== userId) {
      throw new ForbiddenException('타겟 단어장에 접근할 권한이 없습니다.');
    }

    // 단어들이 소스 단어장에 속하는지 확인
    const words = await this.prisma.word.findMany({
      where: {
        id: { in: word_ids },
      },
      include: {
        book: true,
      },
    });

    if (words.length !== word_ids.length) {
      throw new NotFoundException('일부 단어를 찾을 수 없습니다.');
    }

    // 단어들의 소유권 및 소스 단어장 확인
    for (const word of words) {
      if (word.book.userId !== userId) {
        throw new ForbiddenException('일부 단어에 접근할 권한이 없습니다.');
      }

      if (word.bookId !== sourceBookId) {
        throw new BadRequestException(
          '일부 단어가 소스 단어장에 속하지 않습니다.',
        );
      }
    }

    // 타겟 단어장의 현재 단어 수 확인 (300개 제한)
    const targetWordCount = await this.prisma.word.count({
      where: { bookId: target_book_id },
    });

    if (targetWordCount + word_ids.length > 300) {
      throw new BadRequestException(
        `단어장에는 최대 300개의 단어만 추가할 수 있습니다. 현재 ${targetWordCount}개가 있으며, ${word_ids.length}개를 추가하면 제한을 초과합니다.`,
      );
    }

    // 트랜잭션으로 원자성 보장
    const result = await this.prisma.$transaction(async (tx) => {
      // 단어들의 bookId 일괄 업데이트
      const updateResult = await tx.word.updateMany({
        where: {
          id: { in: word_ids },
          bookId: sourceBookId, // 소스 단어장에 속한 단어만 업데이트
        },
        data: {
          bookId: target_book_id,
        },
      });

      return updateResult.count;
    });

    return {
      message: `${result}개의 단어가 성공적으로 이동되었습니다.`,
      moved_count: result,
    };
  }
}
