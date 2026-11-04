-- CreateEnum
CREATE TYPE "channel_connection_status" AS ENUM ('CONNECTED', 'NEEDS_REAUTH', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "listing_status" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'ERROR', 'DELISTED');

-- CreateTable
CREATE TABLE "workspace_data_keys" (
    "workspace_id" UUID NOT NULL,
    "wrapped_key" TEXT NOT NULL,
    "master_key_version" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_data_keys_pkey" PRIMARY KEY ("workspace_id")
);

-- CreateTable
CREATE TABLE "channel_connections" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "external_account_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" "channel_connection_status" NOT NULL DEFAULT 'CONNECTED',
    "credentials" TEXT,
    "credentials_expires_at" TIMESTAMP(3),
    "granted_scopes" TEXT[],
    "settings" JSONB NOT NULL DEFAULT '{}',
    "status_reason" TEXT,
    "connected_by_id" UUID,
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnected_at" TIMESTAMP(3),
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "connection_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "external_id" TEXT,
    "external_url" TEXT,
    "status" "listing_status" NOT NULL DEFAULT 'PENDING',
    "last_error" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_variants" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "external_inventory_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "channel_connections_channel_external_account_id_idx" ON "channel_connections"("channel", "external_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "channel_connections_workspace_id_channel_external_account_i_key" ON "channel_connections"("workspace_id", "channel", "external_account_id");

-- CreateIndex
CREATE INDEX "listings_connection_id_product_id_idx" ON "listings"("connection_id", "product_id");

-- CreateIndex
CREATE INDEX "listings_workspace_id_product_id_idx" ON "listings"("workspace_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "listings_connection_id_external_id_key" ON "listings"("connection_id", "external_id");

-- CreateIndex
CREATE INDEX "listing_variants_variant_id_idx" ON "listing_variants"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_variants_listing_id_variant_id_key" ON "listing_variants"("listing_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_variants_listing_id_external_id_key" ON "listing_variants"("listing_id", "external_id");

-- AddForeignKey
ALTER TABLE "workspace_data_keys" ADD CONSTRAINT "workspace_data_keys_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_connections" ADD CONSTRAINT "channel_connections_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_connections" ADD CONSTRAINT "channel_connections_connected_by_id_fkey" FOREIGN KEY ("connected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "channel_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_variants" ADD CONSTRAINT "listing_variants_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_variants" ADD CONSTRAINT "listing_variants_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
