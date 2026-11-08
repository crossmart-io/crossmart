-- Agent Worker conversations, turns, messages and actions (ADR 0026). Additive: new tables only.
-- CreateTable
CREATE TABLE "agent_worker_conversations" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "running_turn_id" UUID,
    "running_turn_started_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_worker_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_worker_turns" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "model" TEXT,
    "model_calls" INTEGER NOT NULL DEFAULT 0,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "failure_reason" TEXT,
    "cancel_requested_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "agent_worker_turns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_worker_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "turn_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_worker_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_worker_actions" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "tool_use_id" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "risks" TEXT[],
    "summary" TEXT NOT NULL,
    "preview" JSONB,
    "result" TEXT,
    "result_is_error" BOOLEAN NOT NULL DEFAULT false,
    "untrusted_warning" BOOLEAN NOT NULL DEFAULT false,
    "decided_by_user_id" UUID,
    "decided_at" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_worker_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_worker_conversations_workspace_id_user_id_last_activi_idx" ON "agent_worker_conversations"("workspace_id", "user_id", "last_activity_at" DESC);

-- CreateIndex
CREATE INDEX "agent_worker_conversations_last_activity_at_idx" ON "agent_worker_conversations"("last_activity_at");

-- CreateIndex
CREATE INDEX "agent_worker_turns_conversation_id_started_at_idx" ON "agent_worker_turns"("conversation_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "agent_worker_messages_conversation_id_position_key" ON "agent_worker_messages"("conversation_id", "position");

-- CreateIndex
CREATE INDEX "agent_worker_actions_conversation_id_status_idx" ON "agent_worker_actions"("conversation_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "agent_worker_actions_message_id_tool_use_id_key" ON "agent_worker_actions"("message_id", "tool_use_id");

-- AddForeignKey
ALTER TABLE "agent_worker_conversations" ADD CONSTRAINT "agent_worker_conversations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_worker_conversations" ADD CONSTRAINT "agent_worker_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_worker_turns" ADD CONSTRAINT "agent_worker_turns_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "agent_worker_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_worker_messages" ADD CONSTRAINT "agent_worker_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "agent_worker_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_worker_actions" ADD CONSTRAINT "agent_worker_actions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "agent_worker_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_worker_actions" ADD CONSTRAINT "agent_worker_actions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "agent_worker_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

