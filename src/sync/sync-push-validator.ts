import { BadRequestException } from '@nestjs/common';
import type { PushPayload } from './dto/push.dto';

/**
 * deleted 부모와 created/updated 자식 충돌 검증.
 * created·updated id 중복 검증.
 * 모순 payload 시 400 반환.
 */
export function validatePayloadConsistency(payload: PushPayload): void {
  const checkCreatedUpdatedOverlap = (
    created: { id: string }[],
    updated: { id: string }[],
    entityName: string,
  ) => {
    const createdIds = new Set(created.map((x) => x.id));
    const overlap = updated.filter((x) => createdIds.has(x.id));
    if (overlap.length > 0) {
      throw new BadRequestException(
        `모순: ${entityName}의 created와 updated에 동일 id가 중복됨: ${overlap.map((x) => x.id).join(', ')}`,
      );
    }
  };
  checkCreatedUpdatedOverlap(
    payload.profiles?.created ?? [],
    payload.profiles?.updated ?? [],
    'profiles',
  );
  checkCreatedUpdatedOverlap(
    payload.schedules?.created ?? [],
    payload.schedules?.updated ?? [],
    'schedules',
  );
  checkCreatedUpdatedOverlap(
    payload.reviews?.created ?? [],
    payload.reviews?.updated ?? [],
    'reviews',
  );
  checkCreatedUpdatedOverlap(
    payload.word_books?.created ?? [],
    payload.word_books?.updated ?? [],
    'word_books',
  );
  checkCreatedUpdatedOverlap(
    payload.words?.created ?? [],
    payload.words?.updated ?? [],
    'words',
  );
  checkCreatedUpdatedOverlap(
    payload.kanji_books?.created ?? [],
    payload.kanji_books?.updated ?? [],
    'kanji_books',
  );
  checkCreatedUpdatedOverlap(
    payload.kanjis?.created ?? [],
    payload.kanjis?.updated ?? [],
    'kanjis',
  );

  const wbDeleted = new Set(payload.word_books?.deleted ?? []);
  const wDeleted = new Set(payload.words?.deleted ?? []);
  const kbDeleted = new Set(payload.kanji_books?.deleted ?? []);
  const kDeleted = new Set(payload.kanjis?.deleted ?? []);

  for (const w of payload.words?.created ?? []) {
    if (wbDeleted.has(w.book_id)) {
      throw new BadRequestException(
        `모순: 삭제 대상 단어장(${w.book_id})을 words.created에서 참조함`,
      );
    }
  }
  for (const w of payload.words?.updated ?? []) {
    if (wbDeleted.has(w.book_id)) {
      throw new BadRequestException(
        `모순: 삭제 대상 단어장(${w.book_id})을 words.updated에서 참조함`,
      );
    }
  }
  for (const wk of payload.word_kanji?.created ?? []) {
    if (wDeleted.has(wk.word_id)) {
      throw new BadRequestException(
        `모순: 삭제 대상 단어(${wk.word_id})를 word_kanji.created에서 참조함`,
      );
    }
    if (kDeleted.has(wk.kanji_id)) {
      throw new BadRequestException(
        `모순: 삭제 대상 한자(${wk.kanji_id})를 word_kanji.created에서 참조함`,
      );
    }
  }
  for (const kkb of payload.kanji_kanji_book?.created ?? []) {
    if (kbDeleted.has(kkb.kanji_book_id)) {
      throw new BadRequestException(
        `모순: 삭제 대상 한자장(${kkb.kanji_book_id})을 kanji_kanji_book.created에서 참조함`,
      );
    }
    if (kDeleted.has(kkb.kanji_id)) {
      throw new BadRequestException(
        `모순: 삭제 대상 한자(${kkb.kanji_id})를 kanji_kanji_book.created에서 참조함`,
      );
    }
  }
}
