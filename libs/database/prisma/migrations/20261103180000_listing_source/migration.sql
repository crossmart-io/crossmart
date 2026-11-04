-- How a product joined a connection: by hand, by an import, or by the automatic rule.
CREATE TYPE "listing_source" AS ENUM ('MANUAL', 'IMPORT', 'RULE');

ALTER TABLE "listings" ADD COLUMN "source" "listing_source" NOT NULL DEFAULT 'RULE';

-- Listings made before this change were chosen by the merchant (by hand, an override or an
-- import), so they stay in their store until removed by hand.
UPDATE "listings" SET "source" = 'MANUAL';

CREATE INDEX "listings_connection_id_source_idx" ON "listings"("connection_id", "source");
