import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const currentDateQuerySchema = z.object({
  current_date: z
    .string('current_date는 문자열이어야 합니다.')
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'current_date는 YYYY-MM-DD 형식이어야 합니다.',
    ),
});

export class CurrentDateQueryDto extends createZodDto(currentDateQuerySchema) {}
