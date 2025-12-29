import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const jpSearchQuerySchema = z.object({
  query: z
    .string()
    .min(1, '검색어는 최소 1자 이상이어야 합니다.')
    .max(15, '검색어는 15자를 초과할 수 없습니다.')
    .regex(
      /^[\p{Script=Han}\u3040-\u309F\u30A0-\u30FF\s\p{P}]+$/u,
      '일본어(한자, 히라가나, 카타카나), 공백 또는 문장부호만 입력 가능합니다.',
    )
    .refine(
      (val) => !val.includes('{') && !val.includes('}'),
      '중괄호({, })는 사용할 수 없습니다.',
    ),
});

export class JpSearchQueryDto extends createZodDto(jpSearchQuerySchema) {}

const koSearchQuerySchema = z.object({
  query: z
    .string()
    .min(1, '검색어는 최소 1자 이상이어야 합니다.')
    .max(15, '검색어는 15자를 초과할 수 없습니다.')
    .regex(/^[가-힣\s\p{P}]+$/u, '한글, 공백 또는 문장부호만 입력 가능합니다.'),
});

export class KoSearchQueryDto extends createZodDto(koSearchQuerySchema) {}

const kanjiSearchQuerySchema = z.object({
  character: z
    .string()
    .min(1, '한자 문자는 필수입니다')
    .max(1, '한자 문자는 최대 1자까지 입력 가능합니다')
    .regex(/^[\u4E00-\u9FFF]$/, '한자만 입력 가능합니다'),
});

export class KanjiSearchQueryDto extends createZodDto(kanjiSearchQuerySchema) {}
