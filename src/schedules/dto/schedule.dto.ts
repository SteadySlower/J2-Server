import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const scheduleSchema = z.object({
  study_days: z.number().int().positive(),
  review_days: z.array(z.number().int().positive()).min(1),
});

export class ScheduleDto extends createZodDto(scheduleSchema) {}
