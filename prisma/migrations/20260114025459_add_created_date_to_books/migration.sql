/*
  Warnings:

  - Added the required column `created_date` to the `kanji_books` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_date` to the `word_books` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "kanji_books" ADD COLUMN     "created_date" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "word_books" ADD COLUMN     "created_date" TEXT NOT NULL;
