export function mapProfileToDto(p: {
  id: string;
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: p.id,
    user_id: p.userId,
    name: p.name,
    avatar_url: p.avatarUrl,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  };
}

export function mapScheduleToDto(s: {
  id: string;
  userId: string;
  studyDays: number;
  reviewDays: number[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: s.id,
    user_id: s.userId,
    study_days: s.studyDays,
    review_days: s.reviewDays,
    created_at: s.createdAt.toISOString(),
    updated_at: s.updatedAt.toISOString(),
  };
}

export function mapReviewToDto(r: {
  id: string;
  userId: string;
  reviewDate: string;
  wordBookReviews: unknown;
  kanjiBookReviews: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: r.id,
    user_id: r.userId,
    review_date: r.reviewDate,
    word_book_reviews: r.wordBookReviews,
    kanji_book_reviews: r.kanjiBookReviews,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  };
}

export function mapWordBookToDto(wb: {
  id: string;
  userId: string;
  title: string;
  status: string;
  showFront: boolean;
  createdDate: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: wb.id,
    user_id: wb.userId,
    title: wb.title,
    status: wb.status,
    show_front: wb.showFront,
    created_date: wb.createdDate,
    created_at: wb.createdAt.toISOString(),
    updated_at: wb.updatedAt.toISOString(),
  };
}

export function mapWordToDto(w: {
  id: string;
  bookId: string;
  japanese: string;
  meaning: string;
  pronunciation: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: w.id,
    book_id: w.bookId,
    japanese: w.japanese,
    meaning: w.meaning,
    pronunciation: w.pronunciation,
    status: w.status,
    created_at: w.createdAt.toISOString(),
    updated_at: w.updatedAt.toISOString(),
  };
}

export function mapKanjiBookToDto(kb: {
  id: string;
  userId: string;
  title: string;
  status: string;
  showFront: boolean;
  createdDate: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: kb.id,
    user_id: kb.userId,
    title: kb.title,
    status: kb.status,
    show_front: kb.showFront,
    created_date: kb.createdDate,
    created_at: kb.createdAt.toISOString(),
    updated_at: kb.updatedAt.toISOString(),
  };
}

export function mapKanjiToDto(k: {
  id: string;
  userId: string;
  character: string;
  meaning: string;
  onReading: string | null;
  kunReading: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: k.id,
    user_id: k.userId,
    character: k.character,
    meaning: k.meaning,
    on_reading: k.onReading,
    kun_reading: k.kunReading,
    status: k.status,
    created_at: k.createdAt.toISOString(),
    updated_at: k.updatedAt.toISOString(),
  };
}

export function mapWordKanjiToDto(wk: {
  wordId: string;
  kanjiId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    word_id: wk.wordId,
    kanji_id: wk.kanjiId,
    created_at: wk.createdAt.toISOString(),
    updated_at: wk.updatedAt.toISOString(),
  };
}

export function mapKanjiKanjiBookToDto(kkb: {
  kanjiId: string;
  kanjiBookId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    kanji_id: kkb.kanjiId,
    kanji_book_id: kkb.kanjiBookId,
    created_at: kkb.createdAt.toISOString(),
    updated_at: kkb.updatedAt.toISOString(),
  };
}
