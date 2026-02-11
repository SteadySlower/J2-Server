import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKanjiBookDto } from './dto/create-kanji-book.dto';
import { UpdateKanjiBookDto } from './dto/update-kanji-book.dto';
import { MoveKanjisDto } from './dto/move-kanjis.dto';

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

  async findOne(id: string, userId: string, status?: 'learning' | 'learned') {
    const kanjiBook = await this.prisma.kanjiBook.findUnique({
      where: { id },
      include: {
        kanjis: {
          where: status
            ? {
                kanji: {
                  status,
                },
              }
            : undefined,
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

    const { title, showFront = true, created_date } = createKanjiBookDto;

    return await this.prisma.kanjiBook.create({
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

  async moveKanjis(
    sourceBookId: string,
    userId: string,
    moveKanjisDto: MoveKanjisDto,
  ) {
    const { target_book_id, kanji_ids } = moveKanjisDto;

    // 소스 한자장과 타겟 한자장이 같은 경우
    if (sourceBookId === target_book_id) {
      throw new BadRequestException(
        '소스 한자장과 타겟 한자장이 같을 수 없습니다.',
      );
    }

    // 소스 한자장 존재 및 소유권 확인
    const sourceKanjiBook = await this.prisma.kanjiBook.findUnique({
      where: { id: sourceBookId },
    });

    if (!sourceKanjiBook) {
      throw new NotFoundException('소스 한자장을 찾을 수 없습니다.');
    }

    if (sourceKanjiBook.userId !== userId) {
      throw new ForbiddenException('소스 한자장에 접근할 권한이 없습니다.');
    }

    // 타겟 한자장 존재 및 소유권 확인
    const targetKanjiBook = await this.prisma.kanjiBook.findUnique({
      where: { id: target_book_id },
    });

    if (!targetKanjiBook) {
      throw new NotFoundException('타겟 한자장을 찾을 수 없습니다.');
    }

    if (targetKanjiBook.userId !== userId) {
      throw new ForbiddenException('타겟 한자장에 접근할 권한이 없습니다.');
    }

    // 한자들의 소유권 확인
    const kanjis = await this.prisma.kanji.findMany({
      where: {
        id: { in: kanji_ids },
      },
    });

    if (kanjis.length !== kanji_ids.length) {
      throw new NotFoundException('일부 한자를 찾을 수 없습니다.');
    }

    for (const kanji of kanjis) {
      if (kanji.userId !== userId) {
        throw new ForbiddenException('일부 한자에 접근할 권한이 없습니다.');
      }
    }

    // 한자들이 소스 한자장에 속하는지 확인
    const existingRelations = await this.prisma.kanjiKanjiBook.findMany({
      where: {
        kanjiId: { in: kanji_ids },
        kanjiBookId: sourceBookId,
      },
    });

    if (existingRelations.length !== kanji_ids.length) {
      throw new BadRequestException(
        '일부 한자가 소스 한자장에 속하지 않습니다.',
      );
    }

    // 타겟 한자장에 이미 존재하는 한자 확인 (중복 방지)
    const targetRelations = await this.prisma.kanjiKanjiBook.findMany({
      where: {
        kanjiId: { in: kanji_ids },
        kanjiBookId: target_book_id,
      },
    });

    const existingInTarget = new Set(targetRelations.map((rel) => rel.kanjiId));

    // 트랜잭션으로 원자성 보장
    const result = await this.prisma.$transaction(async (tx) => {
      // 소스 한자장과의 관계 삭제
      await tx.kanjiKanjiBook.deleteMany({
        where: {
          kanjiId: { in: kanji_ids },
          kanjiBookId: sourceBookId,
        },
      });

      // 타겟 한자장에 이미 없는 한자들만 관계 생성
      const kanjiIdsToAdd = kanji_ids.filter(
        (kanjiId) => !existingInTarget.has(kanjiId),
      );

      if (kanjiIdsToAdd.length > 0) {
        await tx.kanjiKanjiBook.createMany({
          data: kanjiIdsToAdd.map((kanjiId) => ({
            kanjiId,
            kanjiBookId: target_book_id,
          })),
          skipDuplicates: true,
        });
      }

      return kanji_ids.length;
    });

    return {
      message: `${result}개의 한자가 성공적으로 이동되었습니다.`,
      moved_count: result,
    };
  }
}
