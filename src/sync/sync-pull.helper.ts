export function buildDeletedFromLog(
  deletions: {
    entityType: string;
    entityId: string;
    entityIdSecondary: string | null;
  }[],
) {
  const result = {
    word_books: [] as string[],
    words: [] as string[],
    kanji_books: [] as string[],
    kanjis: [] as string[],
    word_kanji: [] as { word_id: string; kanji_id: string }[],
    kanji_kanji_book: [] as { kanji_id: string; kanji_book_id: string }[],
  };
  for (const d of deletions) {
    switch (d.entityType) {
      case 'word_book':
        result.word_books.push(d.entityId);
        break;
      case 'word':
        result.words.push(d.entityId);
        break;
      case 'kanji_book':
        result.kanji_books.push(d.entityId);
        break;
      case 'kanji':
        result.kanjis.push(d.entityId);
        break;
      case 'word_kanji':
        if (d.entityIdSecondary) {
          result.word_kanji.push({
            word_id: d.entityId,
            kanji_id: d.entityIdSecondary,
          });
        }
        break;
      case 'kanji_kanji_book':
        if (d.entityIdSecondary) {
          result.kanji_kanji_book.push({
            kanji_id: d.entityId,
            kanji_book_id: d.entityIdSecondary,
          });
        }
        break;
    }
  }
  return result;
}
