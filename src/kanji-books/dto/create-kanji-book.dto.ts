import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createKanjiBookSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다'),
  showFront: z.boolean().optional().default(true),
});

export class CreateKanjiBookDto extends createZodDto(createKanjiBookSchema) {}
