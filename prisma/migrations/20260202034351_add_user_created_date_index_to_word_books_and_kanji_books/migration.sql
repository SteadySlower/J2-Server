-- CreateIndex
CREATE INDEX "kanji_books_user_id_created_date_idx" ON "kanji_books"("user_id", "created_date");

-- CreateIndex
CREATE INDEX "word_books_user_id_created_date_idx" ON "word_books"("user_id", "created_date");
