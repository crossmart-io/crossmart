-- Tracks uploaded files, so storage use is a sum and files no product uses are cleaned up.
-- Additive: a new table, two indexes and a trigger; existing rows and queries are unchanged.
-- CreateTable
CREATE TABLE "uploads" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "byte_size" BIGINT NOT NULL,
    "content_type" TEXT NOT NULL,
    "orphaned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uploads_storage_key_key" ON "uploads"("storage_key");

-- CreateIndex
CREATE INDEX "uploads_orphaned_at_workspace_id_idx" ON "uploads"("orphaned_at", "workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "uploads_workspace_id_url_key" ON "uploads"("workspace_id", "url");

-- CreateIndex
CREATE INDEX "product_media_workspace_id_url_idx" ON "product_media"("workspace_id", "url");


-- An upload attached to a product stops being an orphan at once, whatever wrote the media (an
-- edit, a bulk change, an import), so its grace period starts over the next time it is detached.
CREATE FUNCTION "reclaim_attached_uploads"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE "uploads" AS upload
    SET "orphaned_at" = NULL
    FROM "attached_media" AS media
    WHERE upload."workspace_id" = media."workspace_id"
      AND upload."url" = media."url"
      AND upload."orphaned_at" IS NOT NULL;
    RETURN NULL;
END;
$$;

CREATE TRIGGER "product_media_reclaims_uploads"
AFTER INSERT ON "product_media"
REFERENCING NEW TABLE AS "attached_media"
FOR EACH STATEMENT EXECUTE FUNCTION "reclaim_attached_uploads"();
