-- Ask Crossmart conversations, turns and escalations to a person (ADR 0025). Additive: new tables only.
-- CreateTable
CREATE TABLE "ask_conversations" (
    "id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "caller_type" TEXT NOT NULL,
    "client_name" TEXT,
    "owner_key" TEXT NOT NULL,
    "client_fingerprint" TEXT NOT NULL,
    "workspace_id" UUID,
    "user_id" UUID,
    "turn_count" INTEGER NOT NULL DEFAULT 0,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escalated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ask_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ask_turns" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "question_hash" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "citations" JSONB NOT NULL,
    "account_lookups" TEXT[],
    "escalation_reason" TEXT,
    "latency_ms" INTEGER NOT NULL,
    "model" TEXT,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ask_turns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ask_escalations" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "contact_email" TEXT,
    "callback_url" TEXT,
    "reply" TEXT,
    "replied_at" TIMESTAMP(3),
    "replied_by" TEXT,
    "callback_delivered_at" TIMESTAMP(3),
    "callback_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ask_escalations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ask_conversations_public_id_key" ON "ask_conversations"("public_id");

-- CreateIndex
CREATE INDEX "ask_conversations_created_at_idx" ON "ask_conversations"("created_at");

-- CreateIndex
CREATE INDEX "ask_conversations_last_activity_at_idx" ON "ask_conversations"("last_activity_at");

-- CreateIndex
CREATE INDEX "ask_conversations_owner_key_last_activity_at_idx" ON "ask_conversations"("owner_key", "last_activity_at");

-- CreateIndex
CREATE INDEX "ask_turns_created_at_idx" ON "ask_turns"("created_at");

-- CreateIndex
CREATE INDEX "ask_turns_outcome_created_at_idx" ON "ask_turns"("outcome", "created_at");

-- CreateIndex
CREATE INDEX "ask_turns_question_hash_idx" ON "ask_turns"("question_hash");

-- CreateIndex
CREATE UNIQUE INDEX "ask_turns_conversation_id_position_key" ON "ask_turns"("conversation_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ask_escalations_token_hash_key" ON "ask_escalations"("token_hash");

-- CreateIndex
CREATE INDEX "ask_escalations_conversation_id_idx" ON "ask_escalations"("conversation_id");

-- CreateIndex
CREATE INDEX "ask_escalations_status_created_at_idx" ON "ask_escalations"("status", "created_at");

-- AddForeignKey
ALTER TABLE "ask_conversations" ADD CONSTRAINT "ask_conversations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ask_conversations" ADD CONSTRAINT "ask_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ask_turns" ADD CONSTRAINT "ask_turns_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ask_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ask_escalations" ADD CONSTRAINT "ask_escalations_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ask_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

