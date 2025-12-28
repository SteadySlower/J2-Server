/*
  Warnings:

  - You are about to drop the column `kanji_book_id` on the `kanjis` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "kanjis" DROP CONSTRAINT "kanjis_kanji_book_id_fkey";

-- AlterTable
ALTER TABLE "kanjis" DROP COLUMN "kanji_book_id";

-- CreateTable
CREATE TABLE "kanji_kanji_book" (
    "kanji_id" UUID NOT NULL,
    "kanji_book_id" UUID NOT NULL,

    CONSTRAINT "kanji_kanji_book_pkey" PRIMARY KEY ("kanji_id","kanji_book_id")
);

-- AddForeignKey
ALTER TABLE "kanji_kanji_book" ADD CONSTRAINT "kanji_kanji_book_kanji_id_fkey" FOREIGN KEY ("kanji_id") REFERENCES "kanjis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanji_kanji_book" ADD CONSTRAINT "kanji_kanji_book_kanji_book_id_fkey" FOREIGN KEY ("kanji_book_id") REFERENCES "kanji_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
