-- When a running import last wrote a page, so imports whose worker died can be closed.
ALTER TABLE "import_jobs" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Finished imports moved last when they finished.
UPDATE "import_jobs" SET "updated_at" = COALESCE("finished_at", "created_at");

CREATE INDEX "import_jobs_status_updated_at_idx" ON "import_jobs"("status", "updated_at");
