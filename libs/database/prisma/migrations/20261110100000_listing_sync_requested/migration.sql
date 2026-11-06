-- Marks listings whose publish, update or delist a sync or retry queued, until the job finishes,
-- so a store can show them publishing and report a sync's progress.
-- Additive: a nullable column and an index; existing rows and queries are unchanged.
-- AlterTable
ALTER TABLE "listings" ADD COLUMN "sync_requested_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "listings_connection_id_sync_requested_at_idx" ON "listings"("connection_id", "sync_requested_at");
