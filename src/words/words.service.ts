import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';

@Injectable()
export class WordsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createWordDto: CreateWordDto) {
    if (!createWordDto) {
      throw new BadRequestException('Request body is required');
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

    // 단어 생성
    try {
      const word = await this.prisma.word.create({
        data: {
          bookId: book_id,
          japanese,
          meaning,
          pronunciation: pronunciation || null,
        },
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

    const updateData: {
      japanese?: string;
      meaning?: string;
      pronunciation?: string | null;
      status?: 'learning' | 'learned';
    } = {};

    if (updateWordDto.japanese !== undefined) {
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
      const updatedWord = await this.prisma.word.update({
        where: { id },
        data: updateData,
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
}
