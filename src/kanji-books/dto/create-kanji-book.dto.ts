import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { isValidDateString } from '../../common/utils/date';

export const createKanjiBookSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다'),
  showFront: z.boolean().optional().default(true),
  created_date: z
    .string('created_date는 문자열이어야 합니다.')
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'created_date는 YYYY-MM-DD 형식이어야 합니다.',
    )
    .refine(
      (val) => isValidDateString(val),
      'created_date는 유효한 날짜여야 합니다.',
    ),
});

export class CreateKanjiBookDto extends createZodDto(createKanjiBookSchema) {}
