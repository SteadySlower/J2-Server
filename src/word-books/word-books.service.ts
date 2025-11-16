import {
  Injectable,
  OnModuleDestroy,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { CreateWordBookDto } from './dto/create-word-book.dto';

@Injectable()
export class WordBooksService implements OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
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

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
