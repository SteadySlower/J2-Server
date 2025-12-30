import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  더미 데이터 삭제 시작...\n');

  try {
    // 트랜잭션으로 모든 삭제 작업 수행
    await prisma.$transaction(
      async (tx) => {
        // 1. WordBook 삭제 (Word, WordKanji는 Cascade로 자동 삭제됨)
        const deletedWordBooks = await tx.wordBook.deleteMany({});
        console.log(`✅ WordBook 삭제: ${deletedWordBooks.count}개`);

        // 2. KanjiBook 삭제 (KanjiKanjiBook은 Cascade로 자동 삭제됨)
        const deletedKanjiBooks = await tx.kanjiBook.deleteMany({});
        console.log(`✅ KanjiBook 삭제: ${deletedKanjiBooks.count}개`);

        // 3. Word 삭제 (WordBook 삭제로 이미 삭제되었지만, 혹시 모를 경우를 대비)
        const deletedWords = await tx.word.deleteMany({});
        console.log(`✅ Word 삭제: ${deletedWords.count}개`);

        // 4. WordKanji 관계 삭제 (Word 삭제로 이미 삭제되었지만, 혹시 모를 경우를 대비)
        const deletedWordKanjis = await tx.wordKanji.deleteMany({});
        console.log(`✅ WordKanji 관계 삭제: ${deletedWordKanjis.count}개`);

        // 5. KanjiKanjiBook 관계 삭제 (KanjiBook 삭제로 이미 삭제되었지만, 혹시 모를 경우를 대비)
        const deletedKanjiKanjiBooks = await tx.kanjiKanjiBook.deleteMany({});
        console.log(
          `✅ KanjiKanjiBook 관계 삭제: ${deletedKanjiKanjiBooks.count}개`,
        );

        // 6. Kanji 삭제 (이제 WordKanji가 없으므로 삭제 가능)
        const deletedKanjis = await tx.kanji.deleteMany({});
        console.log(`✅ Kanji 삭제: ${deletedKanjis.count}개`);
      },
      {
        maxWait: 60000, // 최대 대기 시간 60초
        timeout: 60000, // 타임아웃 60초
      },
    );

    console.log('\n✨ 모든 더미 데이터 삭제 완료!');
  } catch (error: unknown) {
    console.error('❌ 에러 발생:', error);
    throw error;
  }
}

main()
  .catch((e: unknown) => {
    console.error('❌ 에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
