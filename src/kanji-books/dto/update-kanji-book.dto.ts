import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createKanjiBookSchema } from './create-kanji-book.dto';

const updateKanjiBookSchema = createKanjiBookSchema.partial().extend({
  status: z.enum(['studying', 'studied']).optional(),
});

export class UpdateKanjiBookDto extends createZodDto(updateKanjiBookSchema) {}
