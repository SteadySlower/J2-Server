import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const scheduleSchema = z.object({
  study_days: z
    .number('study_days는 숫자여야 합니다.')
    .int('study_days는 정수여야 합니다.')
    .positive('study_days는 양수여야 합니다.'),
  review_days: z
    .array(
      z
        .number('review_days의 각 요소는 숫자여야 합니다.')
        .int('review_days의 각 요소는 정수여야 합니다.')
        .positive('review_days의 각 요소는 양수여야 합니다.'),
    )
    .min(1, 'review_days는 최소 하나의 값이 필요합니다.'),
});

export class ScheduleDto extends createZodDto(scheduleSchema) {}
