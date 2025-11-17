import { Injectable, BadRequestException } from '@nestjs/common';
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
