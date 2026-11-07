-- Billing (ADR 0024): what the billing provider says about each organization's subscription,
-- and the provider webhook events already handled. Additive only.
--
-- Existing organizations keep status ACTIVE with no provider subscription. That is how an
-- organization from before billing reads, and `BILLING_LEGACY_ACCESS_UNTIL` decides how long it
-- keeps full access (unset: until it chooses a plan). Nobody is locked out by this migration.

-- CreateEnum
CREATE TYPE "billing_interval" AS ENUM ('MONTHLY', 'ANNUAL');

-- AlterEnum: new values are not used in this migration, so one transaction is fine.
ALTER TYPE "subscription_status" ADD VALUE 'INCOMPLETE';
ALTER TYPE "subscription_status" ADD VALUE 'UNPAID';
ALTER TYPE "subscription_status" ADD VALUE 'PAUSED';

-- AlterTable
ALTER TABLE "organization_subscriptions" ADD COLUMN     "billing_interval" "billing_interval",
ADD COLUMN     "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "past_due_since" TIMESTAMP(3),
ADD COLUMN     "trial_end" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "billing_webhook_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: webhooks find the organization by its provider customer. Every value is null today.
CREATE UNIQUE INDEX "organization_subscriptions_external_customer_id_key" ON "organization_subscriptions"("external_customer_id");
