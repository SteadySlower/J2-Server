import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createWordBookSchema } from './create-word-book.dto';

const updateWordBookSchema = createWordBookSchema.partial().extend({
  status: z.enum(['studying', 'studied']).optional(),
});

export class UpdateWordBookDto extends createZodDto(updateWordBookSchema) {}
