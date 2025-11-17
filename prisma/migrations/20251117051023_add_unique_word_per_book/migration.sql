/*
  Warnings:

  - A unique constraint covering the columns `[book_id,japanese]` on the table `words` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "words_book_id_japanese_key" ON "words"("book_id", "japanese");
