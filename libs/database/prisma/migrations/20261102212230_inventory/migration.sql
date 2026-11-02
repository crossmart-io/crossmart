-- AlterEnum
ALTER TYPE "inventory_movement_reason" ADD VALUE 'CORRECTION';
ALTER TYPE "inventory_movement_reason" ADD VALUE 'RECEIVED';
ALTER TYPE "inventory_movement_reason" ADD VALUE 'RETURNED';
ALTER TYPE "inventory_movement_reason" ADD VALUE 'DAMAGED';
ALTER TYPE "inventory_movement_reason" ADD VALUE 'LOST';
ALTER TYPE "inventory_movement_reason" ADD VALUE 'SOLD';

-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "reserved" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "inventory_movements" ADD COLUMN     "actor_user_id" UUID,
ADD COLUMN     "api_key_id" UUID,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "quantity_after" INTEGER;

-- Backfill: until now stock on hand equalled `available`, the running sum of the deltas.
UPDATE "inventory_movements" AS movement
SET "quantity_after" = running."quantity_after"
FROM (
    SELECT "id", SUM("delta") OVER (
        PARTITION BY "inventory_item_id" ORDER BY "created_at", "id"
    ) AS "quantity_after"
    FROM "inventory_movements"
) AS running
WHERE movement."id" = running."id";

ALTER TABLE "inventory_movements" ALTER COLUMN "quantity_after" SET NOT NULL;

-- CreateIndex
CREATE INDEX "inventory_items_workspace_id_tracked_available_idx" ON "inventory_items"("workspace_id", "tracked", "available");

-- CreateIndex
CREATE INDEX "inventory_movements_actor_user_id_idx" ON "inventory_movements"("actor_user_id");

-- CreateIndex
CREATE INDEX "inventory_movements_api_key_id_idx" ON "inventory_movements"("api_key_id");

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
