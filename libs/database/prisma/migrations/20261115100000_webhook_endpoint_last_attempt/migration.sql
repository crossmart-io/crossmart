-- CreateEnum
CREATE TYPE "WebhookAttemptOutcome" AS ENUM ('SUCCEEDED', 'FAILED');

-- AlterTable
ALTER TABLE "webhook_endpoints" ADD COLUMN     "last_attempt_at" TIMESTAMP(3),
ADD COLUMN     "last_attempt_error" TEXT,
ADD COLUMN     "last_attempt_outcome" "WebhookAttemptOutcome",
ADD COLUMN     "last_response_status" INTEGER;

-- Backfill from each endpoint's latest attempted delivery still in the log.
UPDATE "webhook_endpoints" AS endpoint
SET "last_attempt_at" = latest."last_attempt_at",
    "last_attempt_outcome" = CASE
      WHEN latest."status" = 'SUCCEEDED' THEN 'SUCCEEDED'::"WebhookAttemptOutcome"
      ELSE 'FAILED'::"WebhookAttemptOutcome"
    END,
    "last_response_status" = latest."response_status",
    "last_attempt_error" = CASE WHEN latest."status" = 'SUCCEEDED' THEN NULL ELSE latest."error" END
FROM (
  SELECT DISTINCT ON ("endpoint_id") "endpoint_id", "last_attempt_at", "status", "response_status", "error"
  FROM "webhook_deliveries"
  WHERE "last_attempt_at" IS NOT NULL
  ORDER BY "endpoint_id", "last_attempt_at" DESC
) AS latest
WHERE endpoint."id" = latest."endpoint_id";
