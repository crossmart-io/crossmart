-- CreateEnum
CREATE TYPE "suggestion_status" AS ENUM ('PENDING', 'APPLIED', 'REJECTED', 'STALE');

-- CreateEnum
CREATE TYPE "suggestion_creator_type" AS ENUM ('AGENT', 'USER', 'API_KEY');

-- CreateTable
CREATE TABLE "suggestions" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "connection_id" UUID,
    "kind" TEXT NOT NULL,
    "status" "suggestion_status" NOT NULL DEFAULT 'PENDING',
    "current_value" TEXT NOT NULL,
    "proposed_value" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "created_by_type" "suggestion_creator_type" NOT NULL,
    "agent" TEXT,
    "requested_by_user_id" UUID,
    "requested_by_api_key_id" UUID,
    "reviewed_by_user_id" UUID,
    "reviewed_by_api_key_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "feature" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suggestions_workspace_id_status_created_at_id_idx" ON "suggestions"("workspace_id", "status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "suggestions_workspace_id_created_at_id_idx" ON "suggestions"("workspace_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "suggestions_product_id_connection_id_kind_status_idx" ON "suggestions"("product_id", "connection_id", "kind", "status");

-- CreateIndex
CREATE INDEX "suggestions_connection_id_idx" ON "suggestions"("connection_id");

-- CreateIndex
CREATE INDEX "ai_usage_workspace_id_created_at_idx" ON "ai_usage"("workspace_id", "created_at");

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "channel_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_requested_by_api_key_id_fkey" FOREIGN KEY ("requested_by_api_key_id") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_reviewed_by_api_key_id_fkey" FOREIGN KEY ("reviewed_by_api_key_id") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

