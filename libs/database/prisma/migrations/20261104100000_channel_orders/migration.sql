-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('OPEN', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "inventory_movement_reason" ADD VALUE 'ORDER_SHIPPED';

-- AlterTable
ALTER TABLE "channel_connections" ADD COLUMN     "orders_polled_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "connection_id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "order_status" NOT NULL,
    "currency_code" TEXT NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "placed_at" TIMESTAMP(3) NOT NULL,
    "external_updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_lines" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "variant_id" UUID,
    "sku" TEXT,
    "title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "reserved_quantity" INTEGER NOT NULL DEFAULT 0,
    "fulfilled_quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orders_workspace_id_placed_at_id_idx" ON "orders"("workspace_id", "placed_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "orders_workspace_id_status_idx" ON "orders"("workspace_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "orders_connection_id_external_id_key" ON "orders"("connection_id", "external_id");

-- CreateIndex
CREATE INDEX "order_lines_variant_id_idx" ON "order_lines"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_lines_order_id_external_id_key" ON "order_lines"("order_id", "external_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "channel_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
