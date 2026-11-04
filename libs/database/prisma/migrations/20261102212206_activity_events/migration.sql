-- CreateEnum
CREATE TYPE "activity_actor_type" AS ENUM ('USER', 'API_KEY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "activity_outcome" AS ENUM ('SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "activity_events" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "actor_type" "activity_actor_type" NOT NULL,
    "actor_user_id" UUID,
    "actor_api_key_id" UUID,
    "action" TEXT NOT NULL,
    "outcome" "activity_outcome" NOT NULL,
    "subject_type" TEXT,
    "subject_id" UUID,
    "subject_label" TEXT,
    "subject_ids" UUID[],
    "item_count" INTEGER,
    "failure_reason" TEXT,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_events_workspace_id_created_at_id_idx" ON "activity_events"("workspace_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "activity_events_workspace_id_subject_type_subject_id_idx" ON "activity_events"("workspace_id", "subject_type", "subject_id");

-- CreateIndex
CREATE INDEX "activity_events_subject_ids_idx" ON "activity_events" USING GIN ("subject_ids");

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actor_api_key_id_fkey" FOREIGN KEY ("actor_api_key_id") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
