import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { isValidDateString } from '../../common/utils/date';

export const addWordBookReviewSchema = z.object({
  word_book_id: z.string().uuid('단어장 ID는 유효한 UUID 형식이어야 합니다'),
  current_date: z
    .string('current_date는 문자열이어야 합니다.')
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'current_date는 YYYY-MM-DD 형식이어야 합니다.',
    )
    .refine(
      (val) => isValidDateString(val),
      'current_date는 유효한 날짜여야 합니다.',
    ),
});

export class AddWordBookReviewDto extends createZodDto(
  addWordBookReviewSchema,
) {}

export const addKanjiBookReviewSchema = z.object({
  kanji_book_id: z.string().uuid('한자장 ID는 유효한 UUID 형식이어야 합니다'),
  current_date: z
    .string('current_date는 문자열이어야 합니다.')
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'current_date는 YYYY-MM-DD 형식이어야 합니다.',
    )
    .refine(
      (val) => isValidDateString(val),
      'current_date는 유효한 날짜여야 합니다.',
    ),
});

export class AddKanjiBookReviewDto extends createZodDto(
  addKanjiBookReviewSchema,
) {}
