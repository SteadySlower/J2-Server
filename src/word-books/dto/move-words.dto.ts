import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const moveWordsSchema = z.object({
  target_book_id: z
    .string()
    .uuid('타겟 단어장 ID는 유효한 UUID 형식이어야 합니다'),
  word_ids: z
    .array(z.string().uuid('단어 ID는 유효한 UUID 형식이어야 합니다'))
    .min(1, '최소 1개 이상의 단어 ID가 필요합니다'),
});

export class MoveWordsDto extends createZodDto(moveWordsSchema) {}
