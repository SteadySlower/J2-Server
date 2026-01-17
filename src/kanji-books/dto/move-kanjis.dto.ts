import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const moveKanjisSchema = z.object({
  target_book_id: z
    .string()
    .uuid('타겟 한자장 ID는 유효한 UUID 형식이어야 합니다'),
  kanji_ids: z
    .array(z.string().uuid('한자 ID는 유효한 UUID 형식이어야 합니다'))
    .min(1, '최소 1개 이상의 한자 ID가 필요합니다'),
});

export class MoveKanjisDto extends createZodDto(moveKanjisSchema) {}
