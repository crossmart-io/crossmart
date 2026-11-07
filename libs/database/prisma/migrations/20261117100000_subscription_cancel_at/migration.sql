-- When a scheduled cancellation ends the subscription. The billing provider can schedule one at a
-- date (Stripe's Customer Portal sets `cancel_at`) without flagging the period end. Additive.
ALTER TABLE "organization_subscriptions" ADD COLUMN "cancel_at" TIMESTAMP(3);

-- Rows already flagged end at their current period end.
UPDATE "organization_subscriptions"
SET "cancel_at" = "current_period_end"
WHERE "cancel_at_period_end" = true AND "cancel_at" IS NULL;
