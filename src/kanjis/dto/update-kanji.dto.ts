import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createKanjiSchema } from './create-kanji.dto';

const updateKanjiSchema = createKanjiSchema
  .omit({ character: true })
  .partial()
  .extend({
    kanji_book_id: z
      .string()
      .uuid('한자장 ID는 유효한 UUID 형식이어야 합니다')
      .nullable()
      .optional(),
    status: z
      .enum(['learning', 'learned'], {
        message: '상태는 learning 또는 learned여야 합니다.',
      })
      .optional(),
  });

export class UpdateKanjiDto extends createZodDto(updateKanjiSchema) {}
