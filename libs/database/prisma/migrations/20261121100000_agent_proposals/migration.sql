-- Outside agents' proposals (ADR 0028). Additive: a new table, a workspace setting with its
-- default (existing workspaces require approval), and a nullable activity column.
-- AlterTable
ALTER TABLE "activity_events" ADD COLUMN     "actor_approved_by_id" UUID;

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "outside_agent_changes" TEXT NOT NULL DEFAULT 'require_approval';

-- CreateTable
CREATE TABLE "agent_proposals" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "proposer_kind" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "oauth_client_id" TEXT,
    "api_key_id" UUID,
    "agent_name" TEXT NOT NULL,
    "scopes" TEXT[],
    "tool_name" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "risks" TEXT[],
    "summary" TEXT NOT NULL,
    "preview" JSONB,
    "status" TEXT NOT NULL,
    "result" TEXT,
    "result_is_error" BOOLEAN NOT NULL DEFAULT false,
    "decided_by_user_id" UUID,
    "decided_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_proposals_workspace_id_status_created_at_idx" ON "agent_proposals"("workspace_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "agent_proposals_workspace_id_updated_at_idx" ON "agent_proposals"("workspace_id", "updated_at");

-- CreateIndex
CREATE INDEX "agent_proposals_status_expires_at_idx" ON "agent_proposals"("status", "expires_at");

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actor_approved_by_id_fkey" FOREIGN KEY ("actor_approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_proposals" ADD CONSTRAINT "agent_proposals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_proposals" ADD CONSTRAINT "agent_proposals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_proposals" ADD CONSTRAINT "agent_proposals_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_proposals" ADD CONSTRAINT "agent_proposals_decided_by_user_id_fkey" FOREIGN KEY ("decided_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
