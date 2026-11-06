-- Lets a listing show its own brand (vendor) on one channel, and lets the worker find sync
-- requests whose job never ran, across stores, to queue them again.
-- Additive: a nullable column and an index; existing rows and queries are unchanged.
-- AlterTable
ALTER TABLE "listing_overrides" ADD COLUMN "vendor" TEXT;

-- CreateIndex
CREATE INDEX "listings_sync_requested_at_idx" ON "listings"("sync_requested_at");
