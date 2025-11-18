-- DropForeignKey
ALTER TABLE "word_kanji" DROP CONSTRAINT "word_kanji_kanji_id_fkey";

-- AddForeignKey
ALTER TABLE "word_kanji" ADD CONSTRAINT "word_kanji_kanji_id_fkey" FOREIGN KEY ("kanji_id") REFERENCES "kanjis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
