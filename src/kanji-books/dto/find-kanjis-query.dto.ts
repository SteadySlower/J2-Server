import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const findKanjisQuerySchema = z.object({
  status: z
    .enum(['learning', 'learned'], 'status는 learning 또는 learned여야 합니다.')
    .optional(),
});

export class FindKanjisQueryDto extends createZodDto(findKanjisQuerySchema) {}
