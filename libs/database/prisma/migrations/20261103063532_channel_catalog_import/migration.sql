-- AlterTable
ALTER TABLE "import_jobs" ADD COLUMN     "connection_id" UUID,
ADD COLUMN     "cursor" TEXT,
ADD COLUMN     "linked_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_count" INTEGER;

-- CreateIndex
CREATE INDEX "import_jobs_connection_id_status_idx" ON "import_jobs"("connection_id", "status");

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "channel_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
