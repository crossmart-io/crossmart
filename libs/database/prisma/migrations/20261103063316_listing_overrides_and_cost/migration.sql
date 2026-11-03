-- CreateEnum
CREATE TYPE "listing_visibility" AS ENUM ('VISIBLE', 'HIDDEN');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "media_digest" TEXT;

-- AlterTable
ALTER TABLE "variants" ADD COLUMN     "cost" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "listing_overrides" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "title" TEXT,
    "description_html" TEXT,
    "tags_overridden" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "media_overridden" BOOLEAN NOT NULL DEFAULT false,
    "media_urls" TEXT[],
    "visibility" "listing_visibility",
    "inventory_buffer" INTEGER,
    "max_quantity" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_variant_overrides" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "price" DECIMAL(12,2),
    "compare_at_price" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_variant_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listing_overrides_listing_id_key" ON "listing_overrides"("listing_id");

-- CreateIndex
CREATE INDEX "listing_overrides_workspace_id_idx" ON "listing_overrides"("workspace_id");

-- CreateIndex
CREATE INDEX "listing_variant_overrides_variant_id_idx" ON "listing_variant_overrides"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_variant_overrides_listing_id_variant_id_key" ON "listing_variant_overrides"("listing_id", "variant_id");

-- CreateIndex
CREATE INDEX "listings_connection_id_status_idx" ON "listings"("connection_id", "status");

-- AddForeignKey
ALTER TABLE "listing_overrides" ADD CONSTRAINT "listing_overrides_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_variant_overrides" ADD CONSTRAINT "listing_variant_overrides_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_variant_overrides" ADD CONSTRAINT "listing_variant_overrides_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
