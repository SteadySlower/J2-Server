import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const cursorSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      try {
        const obj = JSON.parse(val) as unknown;
        return typeof obj === 'object' && obj !== null;
      } catch {
        return false;
      }
    },
    { message: 'cursor는 유효한 JSON 객체 문자열이어야 합니다.' },
  );

export const pullQuerySchema = z.object({
  since: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'since는 유효한 ISO 8601 날짜/시간 형식이어야 합니다.',
    ),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1000))
    .refine((val) => val > 0 && val <= 5000, {
      message: 'limit은 1~5000 사이여야 합니다.',
    }),
  cursor: cursorSchema,
});

export class PullQueryDto extends createZodDto(pullQuerySchema) {}
