-- CreateTable
CREATE TABLE "kanji_dictionary" (
    "id" UUID NOT NULL,
    "character" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "on_reading" TEXT,
    "kun_reading" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanji_dictionary_pkey" PRIMARY KEY ("id")
);
