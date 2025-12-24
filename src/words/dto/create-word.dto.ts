import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createWordSchema = z.object({
  book_id: z.string().uuid('단어장 ID는 유효한 UUID 형식이어야 합니다'),
  japanese: z
    .string()
    .min(1, '일본어 단어는 필수입니다')
    .max(100, '일본어 단어는 최대 100자까지 입력 가능합니다')
    .refine(
      (val) => !val.includes('{') && !val.includes('}'),
      '중괄호({, })는 사용할 수 없습니다.',
    ),
  meaning: z
    .string()
    .min(1, '의미는 필수입니다')
    .max(100, '의미는 최대 100자까지 입력 가능합니다'),
  pronunciation: z.string().optional(),
});

export class CreateWordDto extends createZodDto(createWordSchema) {}
