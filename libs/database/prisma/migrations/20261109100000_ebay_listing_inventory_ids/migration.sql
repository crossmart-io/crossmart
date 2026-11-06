-- eBay sets stock per SKU, and a listing variant's eBay SKU is its `external_id`. Listings
-- published before stock sync stored no inventory id, so they get their SKU as one, and
-- Crossmart's stock reaches them without publishing them again. Data only: no schema change.
UPDATE "listing_variants" AS "variant"
SET "external_inventory_id" = "variant"."external_id"
FROM "listings" AS "listing"
JOIN "channel_connections" AS "connection" ON "connection"."id" = "listing"."connection_id"
WHERE "listing"."id" = "variant"."listing_id"
  AND "connection"."channel" = 'ebay'
  AND "variant"."external_inventory_id" IS NULL;
