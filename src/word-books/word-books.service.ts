import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWordBookDto } from './dto/create-word-book.dto';
import { UpdateWordBookDto } from './dto/update-word-book.dto';

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

    const { title, showFront = true } = createWordBookDto;

    return await this.prisma.wordBook.create({
      data: {
        userId,
        title,
        showFront,
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
}
