import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createWordSchema } from './create-word.dto';

const updateWordSchema = createWordSchema
  .omit({ book_id: true })
  .partial()
  .extend({
    status: z
      .enum(['learning', 'learned'], {
        message: '상태는 learning 또는 learned여야 합니다.',
      })
      .optional(),
  });

export class UpdateWordDto extends createZodDto(updateWordSchema) {}
