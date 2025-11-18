import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKanjiBookDto } from './dto/create-kanji-book.dto';

@Injectable()
export class KanjiBooksService {
  constructor(private prisma: PrismaService) {}

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
}
