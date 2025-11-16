-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('studying', 'studied');

-- CreateEnum
CREATE TYPE "WordStatus" AS ENUM ('learning', 'learned');

-- CreateTable
CREATE TABLE "profile" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_books" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" "BookStatus" NOT NULL DEFAULT 'studying',
    "show_front" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "word_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "words" (
    "id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "japanese" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "pronunciation" TEXT,
    "status" "WordStatus" NOT NULL DEFAULT 'learning',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanji_books" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" "BookStatus" NOT NULL DEFAULT 'studying',
    "show_front" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanji_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanjis" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kanji_book_id" UUID,
    "character" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "on_reading" TEXT,
    "kun_reading" TEXT,
    "status" "WordStatus" NOT NULL DEFAULT 'learning',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanjis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_kanji" (
    "word_id" UUID NOT NULL,
    "kanji_id" UUID NOT NULL,

    CONSTRAINT "word_kanji_pkey" PRIMARY KEY ("word_id","kanji_id")
);

-- CreateTable
CREATE TABLE "dictionary" (
    "id" UUID NOT NULL,
    "japanese" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "pronunciation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dictionary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_cache_pronunciation" (
    "query_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_cache_pronunciation_pkey" PRIMARY KEY ("query_hash")
);

-- CreateTable
CREATE TABLE "ai_cache_japanese" (
    "query_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_cache_japanese_pkey" PRIMARY KEY ("query_hash")
);

-- CreateTable
CREATE TABLE "ai_cache_meaning" (
    "query_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_cache_meaning_pkey" PRIMARY KEY ("query_hash")
);

-- CreateTable
CREATE TABLE "ai_cache_pronunciation_dictionary" (
    "cache_query_hash" TEXT NOT NULL,
    "dictionary_id" UUID NOT NULL,

    CONSTRAINT "ai_cache_pronunciation_dictionary_pkey" PRIMARY KEY ("cache_query_hash","dictionary_id")
);

-- CreateTable
CREATE TABLE "ai_cache_japanese_dictionary" (
    "cache_query_hash" TEXT NOT NULL,
    "dictionary_id" UUID NOT NULL,

    CONSTRAINT "ai_cache_japanese_dictionary_pkey" PRIMARY KEY ("cache_query_hash","dictionary_id")
);

-- CreateTable
CREATE TABLE "ai_cache_meaning_dictionary" (
    "cache_query_hash" TEXT NOT NULL,
    "dictionary_id" UUID NOT NULL,

    CONSTRAINT "ai_cache_meaning_dictionary_pkey" PRIMARY KEY ("cache_query_hash","dictionary_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kanjis_user_id_character_key" ON "kanjis"("user_id", "character");

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "word_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanjis" ADD CONSTRAINT "kanjis_kanji_book_id_fkey" FOREIGN KEY ("kanji_book_id") REFERENCES "kanji_books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_kanji" ADD CONSTRAINT "word_kanji_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_kanji" ADD CONSTRAINT "word_kanji_kanji_id_fkey" FOREIGN KEY ("kanji_id") REFERENCES "kanjis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_cache_pronunciation_dictionary" ADD CONSTRAINT "ai_cache_pronunciation_dictionary_cache_query_hash_fkey" FOREIGN KEY ("cache_query_hash") REFERENCES "ai_cache_pronunciation"("query_hash") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_cache_pronunciation_dictionary" ADD CONSTRAINT "ai_cache_pronunciation_dictionary_dictionary_id_fkey" FOREIGN KEY ("dictionary_id") REFERENCES "dictionary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_cache_japanese_dictionary" ADD CONSTRAINT "ai_cache_japanese_dictionary_cache_query_hash_fkey" FOREIGN KEY ("cache_query_hash") REFERENCES "ai_cache_japanese"("query_hash") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_cache_japanese_dictionary" ADD CONSTRAINT "ai_cache_japanese_dictionary_dictionary_id_fkey" FOREIGN KEY ("dictionary_id") REFERENCES "dictionary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_cache_meaning_dictionary" ADD CONSTRAINT "ai_cache_meaning_dictionary_cache_query_hash_fkey" FOREIGN KEY ("cache_query_hash") REFERENCES "ai_cache_meaning"("query_hash") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_cache_meaning_dictionary" ADD CONSTRAINT "ai_cache_meaning_dictionary_dictionary_id_fkey" FOREIGN KEY ("dictionary_id") REFERENCES "dictionary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
