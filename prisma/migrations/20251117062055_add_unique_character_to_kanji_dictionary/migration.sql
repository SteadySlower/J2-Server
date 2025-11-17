/*
  Warnings:

  - A unique constraint covering the columns `[character]` on the table `kanji_dictionary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "kanji_dictionary_character_key" ON "kanji_dictionary"("character");
