-- AlterTable
ALTER TABLE "activity_events" ADD COLUMN     "actor_agent_name" TEXT;

-- CreateIndex
CREATE INDEX "activity_events_actor_oauth_client_id_created_at_idx" ON "activity_events"("actor_oauth_client_id", "created_at");
