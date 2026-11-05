-- CreateTable
CREATE TABLE "listing_item_specifics" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "values" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_item_specifics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_item_specifics_workspace_id_idx" ON "listing_item_specifics"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_item_specifics_listing_id_name_key" ON "listing_item_specifics"("listing_id", "name");

-- AddForeignKey
ALTER TABLE "listing_item_specifics" ADD CONSTRAINT "listing_item_specifics_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

