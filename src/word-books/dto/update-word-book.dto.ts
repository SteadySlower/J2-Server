import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const updateWordBookSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다').optional(),
  status: z.enum(['studying', 'studied']).optional(),
  showFront: z.boolean().optional(),
});

export class UpdateWordBookDto extends createZodDto(updateWordBookSchema) {}
