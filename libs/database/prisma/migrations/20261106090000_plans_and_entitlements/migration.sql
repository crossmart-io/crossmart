-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED');

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_versions" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_features" (
    "id" UUID NOT NULL,
    "plan_version_id" UUID NOT NULL,
    "feature" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "limit_value" INTEGER,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_subscriptions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "plan_version_id" UUID NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'ACTIVE',
    "current_period_end" TIMESTAMP(3),
    "external_customer_id" TEXT,
    "external_subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "plan_versions_plan_id_version_key" ON "plan_versions"("plan_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "plan_features_plan_version_id_feature_key" ON "plan_features"("plan_version_id", "feature");

-- CreateIndex
CREATE UNIQUE INDEX "organization_subscriptions_organization_id_key" ON "organization_subscriptions"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_subscriptions_external_subscription_id_key" ON "organization_subscriptions"("external_subscription_id");

-- CreateIndex
CREATE INDEX "organization_subscriptions_plan_version_id_idx" ON "organization_subscriptions"("plan_version_id");

-- CreateIndex
CREATE INDEX "listings_workspace_id_status_idx" ON "listings"("workspace_id", "status");

-- AddForeignKey
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_version_id_fkey" FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_plan_version_id_fkey" FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ─── Seed: the plans of docs/PLAN.md §6, version 1 ───────────────────────────
-- A starting point to validate with design partners. Change a plan by adding a version, never
-- by editing one organizations are on. Enterprise is custom and not seeded.
-- Feature values are `Feature` (libs/core/src/entitlements/enums/feature.enum.ts); a null limit
-- is unlimited.

INSERT INTO "plans" ("id", "code", "name", "active", "is_default", "sort_order", "updated_at") VALUES
    (gen_random_uuid(), 'free', 'Free', true, true, 10, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'starter', 'Starter', true, false, 20, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'growth', 'Growth', true, false, 30, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'agency', 'Agency', true, false, 40, CURRENT_TIMESTAMP);

INSERT INTO "plan_versions" ("id", "plan_id", "version")
SELECT gen_random_uuid(), "id", 1 FROM "plans";

INSERT INTO "plan_features" ("id", "plan_version_id", "feature", "enabled", "limit_value")
SELECT gen_random_uuid(), "plan_versions"."id", "grant"."feature", "grant"."enabled", "grant"."limit_value"
FROM (VALUES
    ('free', 'active_listings', true, 50),
    ('free', 'channel_connections', true, 2),
    ('free', 'workspaces', true, 1),
    ('free', 'members', true, 2),
    ('free', 'api_keys', true, 2),
    ('free', 'ai_credits', true, 100),
    ('free', 'autonomous_agents', false, NULL),
    ('free', 'bring_your_own_key', false, NULL),
    ('starter', 'active_listings', true, 1000),
    ('starter', 'channel_connections', true, NULL),
    ('starter', 'workspaces', true, 1),
    ('starter', 'members', true, 5),
    ('starter', 'api_keys', true, 10),
    ('starter', 'ai_credits', true, 1000),
    ('starter', 'autonomous_agents', false, NULL),
    ('starter', 'bring_your_own_key', false, NULL),
    ('growth', 'active_listings', true, 10000),
    ('growth', 'channel_connections', true, NULL),
    ('growth', 'workspaces', true, 1),
    ('growth', 'members', true, 15),
    ('growth', 'api_keys', true, 25),
    ('growth', 'ai_credits', true, 5000),
    ('growth', 'autonomous_agents', true, NULL),
    ('growth', 'bring_your_own_key', false, NULL),
    ('agency', 'active_listings', true, 50000),
    ('agency', 'channel_connections', true, NULL),
    ('agency', 'workspaces', true, 25),
    ('agency', 'members', true, NULL),
    ('agency', 'api_keys', true, 100),
    ('agency', 'ai_credits', true, 20000),
    ('agency', 'autonomous_agents', true, NULL),
    ('agency', 'bring_your_own_key', true, NULL)
) AS "grant" ("plan_code", "feature", "enabled", "limit_value")
JOIN "plans" ON "plans"."code" = "grant"."plan_code"
JOIN "plan_versions" ON "plan_versions"."plan_id" = "plans"."id" AND "plan_versions"."version" = 1;

-- ─── Backfill: every existing organization starts on the default plan ────────
INSERT INTO "organization_subscriptions" ("id", "organization_id", "plan_version_id", "status", "updated_at")
SELECT gen_random_uuid(), "organizations"."id", "plan_versions"."id", 'ACTIVE', CURRENT_TIMESTAMP
FROM "organizations"
CROSS JOIN "plans"
JOIN "plan_versions" ON "plan_versions"."plan_id" = "plans"."id" AND "plan_versions"."version" = 1
WHERE "plans"."is_default"
  AND NOT EXISTS (
    SELECT 1 FROM "organization_subscriptions" WHERE "organization_id" = "organizations"."id"
  );
