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
          orderBy: {
            createdAt: 'desc',
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
      kanjis: kanjiBook.kanjis.map((kanji) => ({
        id: kanji.id,
        character: kanji.character,
        meaning: kanji.meaning,
        on_reading: kanji.onReading,
        kun_reading: kanji.kunReading,
        status: kanji.status,
        created_at: kanji.createdAt.toISOString(),
        updated_at: kanji.updatedAt.toISOString(),
      })),
    };
  }

  async create(userId: string, createKanjiBookDto: CreateKanjiBookDto) {
    if (!createKanjiBookDto) {
      throw new BadRequestException('Request body is required');
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
