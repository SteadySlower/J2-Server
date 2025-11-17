import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWordBookDto } from './dto/create-word-book.dto';

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
      })),
    };
  }

  async create(userId: string, createWordBookDto: CreateWordBookDto) {
    if (!createWordBookDto) {
      throw new BadRequestException('Request body is required');
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
}
