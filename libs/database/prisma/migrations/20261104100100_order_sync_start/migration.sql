-- When Crossmart started reading a store's orders; orders placed earlier hold no stock.
-- AlterTable
ALTER TABLE "channel_connections" ADD COLUMN     "orders_synced_from" TIMESTAMP(3);
