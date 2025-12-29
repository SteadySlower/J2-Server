import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKanjiBookDto } from './dto/create-kanji-book.dto';
import { UpdateKanjiBookDto } from './dto/update-kanji-book.dto';

@Injectable()
export class KanjiBooksService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return await this.prisma.kanjiBook.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const kanjiBook = await this.prisma.kanjiBook.findUnique({
      where: { id },
      include: {
        kanjis: {
          include: {
            kanji: true,
          },
          orderBy: {
            kanji: {
              createdAt: 'desc',
            },
          },
        },
      },
    });

    if (!kanjiBook) {
      throw new NotFoundException('한자장을 찾을 수 없습니다.');
    }

    if (kanjiBook.userId !== userId) {
      throw new ForbiddenException('이 한자장에 접근할 권한이 없습니다.');
    }

    return {
      id: kanjiBook.id,
      title: kanjiBook.title,
      status: kanjiBook.status,
      showFront: kanjiBook.showFront,
      created_at: kanjiBook.createdAt.toISOString(),
      updated_at: kanjiBook.updatedAt.toISOString(),
      kanjis: kanjiBook.kanjis.map((kanjiKanjiBook) => ({
        id: kanjiKanjiBook.kanji.id,
        character: kanjiKanjiBook.kanji.character,
        meaning: kanjiKanjiBook.kanji.meaning,
        on_reading: kanjiKanjiBook.kanji.onReading,
        kun_reading: kanjiKanjiBook.kanji.kunReading,
        status: kanjiKanjiBook.kanji.status,
        created_at: kanjiKanjiBook.kanji.createdAt.toISOString(),
        updated_at: kanjiKanjiBook.kanji.updatedAt.toISOString(),
      })),
    };
  }

  async create(userId: string, createKanjiBookDto: CreateKanjiBookDto) {
    if (!createKanjiBookDto) {
      throw new BadRequestException('요청 본문이 필요합니다.');
    }

    const { title, showFront = true } = createKanjiBookDto;

    return await this.prisma.kanjiBook.create({
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
    updateKanjiBookDto: UpdateKanjiBookDto,
  ) {
    const kanjiBook = await this.prisma.kanjiBook.findUnique({
      where: { id },
    });

    if (!kanjiBook) {
      throw new NotFoundException('한자장을 찾을 수 없습니다.');
    }

    if (kanjiBook.userId !== userId) {
      throw new ForbiddenException('이 한자장에 접근할 권한이 없습니다.');
    }

    const updateData: {
      title?: string;
      status?: 'studying' | 'studied';
      showFront?: boolean;
    } = {};

    if (updateKanjiBookDto.title !== undefined) {
      updateData.title = updateKanjiBookDto.title;
    }
    if (updateKanjiBookDto.status !== undefined) {
      updateData.status = updateKanjiBookDto.status;
    }
    if (updateKanjiBookDto.showFront !== undefined) {
      updateData.showFront = updateKanjiBookDto.showFront;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('수정할 필드가 없습니다.');
    }

    return await this.prisma.kanjiBook.update({
      where: { id },
      data: updateData,
    });
  }

  async removeKanjiFromBook(bookId: string, kanjiId: string, userId: string) {
    const kanjiBook = await this.prisma.kanjiBook.findUnique({
      where: { id: bookId },
    });

    if (!kanjiBook) {
      throw new NotFoundException('한자장을 찾을 수 없습니다.');
    }

    if (kanjiBook.userId !== userId) {
      throw new ForbiddenException('이 한자장에 접근할 권한이 없습니다.');
    }

    const kanji = await this.prisma.kanji.findUnique({
      where: { id: kanjiId },
    });

    if (!kanji) {
      throw new NotFoundException('한자를 찾을 수 없습니다.');
    }

    if (kanji.userId !== userId) {
      throw new ForbiddenException('이 한자에 접근할 권한이 없습니다.');
    }

    const relation = await this.prisma.kanjiKanjiBook.findUnique({
      where: {
        kanjiId_kanjiBookId: {
          kanjiId,
          kanjiBookId: bookId,
        },
      },
    });

    if (!relation) {
      throw new NotFoundException(
        '해당 한자가 이 한자장에 포함되어 있지 않습니다.',
      );
    }

    await this.prisma.kanjiKanjiBook.delete({
      where: {
        kanjiId_kanjiBookId: {
          kanjiId,
          kanjiBookId: bookId,
        },
      },
    });

    return {
      message: '한자가 한자장에서 성공적으로 제거되었습니다.',
    };
  }

  async remove(id: string, userId: string) {
    const kanjiBook = await this.prisma.kanjiBook.findUnique({
      where: { id },
    });

    if (!kanjiBook) {
      throw new NotFoundException('한자장을 찾을 수 없습니다.');
    }

    if (kanjiBook.userId !== userId) {
      throw new ForbiddenException('이 한자장에 접근할 권한이 없습니다.');
    }

    await this.prisma.kanjiBook.delete({
      where: { id },
    });

    return {
      message: '한자장이 성공적으로 삭제되었습니다.',
    };
  }
}
