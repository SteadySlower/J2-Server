import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const pullQuerySchema = z.object({
  since: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'since는 유효한 ISO 8601 날짜/시간 형식이어야 합니다.',
    ),
});

export class PullQueryDto extends createZodDto(pullQuerySchema) {}
