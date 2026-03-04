-- CreateTable
CREATE TABLE "sync_deletions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "entity_id_secondary" UUID,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_deletions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_deletions_user_id_entity_type_deleted_at_idx" ON "sync_deletions"("user_id", "entity_type", "deleted_at");
