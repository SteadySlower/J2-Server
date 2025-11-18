import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createKanjiSchema = z.object({
  kanji_book_id: z
    .string()
    .uuid('한자장 ID는 유효한 UUID 형식이어야 합니다')
    .optional(),
  character: z
    .string()
    .length(1, '한자 문자는 정확히 1자여야 합니다')
    .regex(
      /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/,
      '한자 문자만 입력 가능합니다',
    ),
  meaning: z.string().min(1, '의미는 필수입니다'),
  on_reading: z.string().nullable().optional(),
  kun_reading: z.string().nullable().optional(),
});

export class CreateKanjiDto extends createZodDto(createKanjiSchema) {}
