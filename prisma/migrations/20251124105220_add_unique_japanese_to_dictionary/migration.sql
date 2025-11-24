/*
  Warnings:

  - A unique constraint covering the columns `[japanese]` on the table `dictionary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "dictionary_japanese_key" ON "dictionary"("japanese");
