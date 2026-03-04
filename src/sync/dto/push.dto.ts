import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { isValidDateString } from '../../common/utils/date';

const uuidSchema = z.string().uuid();

const profileItemSchema = z.object({
  id: uuidSchema,
  name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

const scheduleItemSchema = z.object({
  id: uuidSchema,
  study_days: z.number().int().min(0),
  review_days: z.array(z.number().int().positive()),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

const reviewItemSchema = z.object({
  id: uuidSchema,
  review_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  word_book_reviews: z.array(uuidSchema),
  kanji_book_reviews: z.array(uuidSchema),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

const wordBookItemSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1),
  status: z.enum(['studying', 'studied']).optional().default('studying'),
  show_front: z.boolean().optional().default(true),
  created_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((val) => isValidDateString(val)),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

const wordItemSchema = z.object({
  id: uuidSchema,
  book_id: uuidSchema,
  japanese: z.string().min(1).max(100),
  meaning: z.string().min(1).max(100),
  pronunciation: z.string().nullable().optional(),
  status: z.enum(['learning', 'learned']).optional().default('learning'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

const kanjiBookItemSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1),
  status: z.enum(['studying', 'studied']).optional().default('studying'),
  show_front: z.boolean().optional().default(true),
  created_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((val) => isValidDateString(val)),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

const kanjiItemSchema = z.object({
  id: uuidSchema,
  character: z
    .string()
    .length(1)
    .regex(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/),
  meaning: z.string().min(1),
  on_reading: z.string().nullable().optional(),
  kun_reading: z.string().nullable().optional(),
  status: z.enum(['learning', 'learned']).optional().default('learning'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

const wordKanjiItemSchema = z.object({
  word_id: uuidSchema,
  kanji_id: uuidSchema,
});

const kanjiKanjiBookItemSchema = z.object({
  kanji_id: uuidSchema,
  kanji_book_id: uuidSchema,
});

const syncChangesSchema = z.object({
  profiles: z
    .object({
      created: z.array(profileItemSchema).optional().default([]),
      updated: z.array(profileItemSchema).optional().default([]),
    })
    .optional()
    .default({ created: [], updated: [] }),
  schedules: z
    .object({
      created: z.array(scheduleItemSchema).optional().default([]),
      updated: z.array(scheduleItemSchema).optional().default([]),
    })
    .optional()
    .default({ created: [], updated: [] }),
  reviews: z
    .object({
      created: z.array(reviewItemSchema).optional().default([]),
      updated: z.array(reviewItemSchema).optional().default([]),
    })
    .optional()
    .default({ created: [], updated: [] }),
  word_books: z
    .object({
      created: z.array(wordBookItemSchema).optional().default([]),
      updated: z.array(wordBookItemSchema).optional().default([]),
      deleted: z.array(uuidSchema).optional().default([]),
    })
    .optional()
    .default({ created: [], updated: [], deleted: [] }),
  words: z
    .object({
      created: z.array(wordItemSchema).optional().default([]),
      updated: z.array(wordItemSchema).optional().default([]),
      deleted: z.array(uuidSchema).optional().default([]),
    })
    .optional()
    .default({ created: [], updated: [], deleted: [] }),
  kanji_books: z
    .object({
      created: z.array(kanjiBookItemSchema).optional().default([]),
      updated: z.array(kanjiBookItemSchema).optional().default([]),
      deleted: z.array(uuidSchema).optional().default([]),
    })
    .optional()
    .default({ created: [], updated: [], deleted: [] }),
  kanjis: z
    .object({
      created: z.array(kanjiItemSchema).optional().default([]),
      updated: z.array(kanjiItemSchema).optional().default([]),
      deleted: z.array(uuidSchema).optional().default([]),
    })
    .optional()
    .default({ created: [], updated: [], deleted: [] }),
  word_kanji: z
    .object({
      created: z.array(wordKanjiItemSchema).optional().default([]),
      deleted: z.array(wordKanjiItemSchema).optional().default([]),
    })
    .optional()
    .default({ created: [], deleted: [] }),
  kanji_kanji_book: z
    .object({
      created: z.array(kanjiKanjiBookItemSchema).optional().default([]),
      deleted: z.array(kanjiKanjiBookItemSchema).optional().default([]),
    })
    .optional()
    .default({ created: [], deleted: [] }),
});

export class PushDto extends createZodDto(syncChangesSchema) {}

export type PushPayload = z.infer<typeof syncChangesSchema>;
