import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const updateWordSchema = z.object({
  japanese: z.string().min(1, '일본어 단어는 필수입니다').optional(),
  meaning: z.string().min(1, '의미는 필수입니다').optional(),
  pronunciation: z.string().optional(),
  status: z
    .enum(['learning', 'learned'], {
      message: '상태는 learning 또는 learned여야 합니다.',
    })
    .optional(),
});

export class UpdateWordDto extends createZodDto(updateWordSchema) {}
