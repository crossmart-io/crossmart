-- The workspace event stream (ADR 0027). Additive: one nullable column and two indexes.

-- The store an activity event happened on, so the event stream can point at it on the map.
ALTER TABLE "activity_events" ADD COLUMN "connection_id" UUID;

-- When an agent tool call finished, so the stream can say when a read answered or a change failed.
ALTER TABLE "agent_worker_actions" ADD COLUMN "finished_at" TIMESTAMP(3);

-- Orders as they arrive.
CREATE INDEX "orders_workspace_id_created_at_idx" ON "orders"("workspace_id", "created_at");

-- Webhook deliveries that gave up, as they settle.
CREATE INDEX "webhook_deliveries_workspace_id_status_updated_at_idx" ON "webhook_deliveries"("workspace_id", "status", "updated_at");
