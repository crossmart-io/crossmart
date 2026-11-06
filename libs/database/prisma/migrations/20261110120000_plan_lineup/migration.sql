-- The Crossmart Cloud plan lineup of ADR 0020: Starter, Pro, Growth, Scale and Enterprise, priced
-- by active listings. Data only: no table changes.
--
-- * Starter and Growth get version 2. Version 1 stays as it is, so anyone on it keeps it.
-- * Pro, Scale and Enterprise are new. Enterprise is sold by contract: version 1 is the floor a
--   contract starts from, and a deal with other numbers gets a version of its own.
-- * Free and Agency are legacy: no longer offered, never deleted. Organizations on them keep their
--   plan until they choose another one.
-- * Starter becomes the plan new organizations start on, since Free is no longer offered.
--
-- Prices are not stored here: billing owns them (ADR 0018, a Stripe price per plan code).
-- Feature values are `Feature` (libs/core/src/entitlements/enums/feature.enum.ts); a null limit is
-- unlimited, and every version lists every feature.

-- ─── Plans ───────────────────────────────────────────────────────────────────
INSERT INTO "plans" ("id", "code", "name", "active", "is_default", "sort_order", "updated_at") VALUES
    (gen_random_uuid(), 'pro', 'Pro', true, false, 30, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'scale', 'Scale', true, false, 50, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'enterprise', 'Enterprise', true, false, 60, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

UPDATE "plans"
SET "sort_order" = "lineup"."sort_order", "updated_at" = CURRENT_TIMESTAMP
FROM (VALUES ('starter', 20), ('growth', 40), ('agency', 70)) AS "lineup" ("code", "sort_order")
WHERE "plans"."code" = "lineup"."code";

-- Legacy plans: kept for the organizations on them, offered to no one new.
UPDATE "plans"
SET "active" = false, "is_default" = false, "updated_at" = CURRENT_TIMESTAMP
WHERE "code" IN ('free', 'agency');

UPDATE "plans"
SET "is_default" = ("code" = 'starter'), "updated_at" = CURRENT_TIMESTAMP
WHERE "active";

-- ─── Versions: the next version of each lineup plan ──────────────────────────
INSERT INTO "plan_versions" ("id", "plan_id", "version")
SELECT gen_random_uuid(), "plans"."id", COALESCE(MAX("plan_versions"."version"), 0) + 1
FROM "plans"
LEFT JOIN "plan_versions" ON "plan_versions"."plan_id" = "plans"."id"
WHERE "plans"."code" IN ('starter', 'pro', 'growth', 'scale', 'enterprise')
GROUP BY "plans"."id";

-- ─── Features of the new versions ────────────────────────────────────────────
-- API keys are not part of the published lineup; these keep the earlier proportions.
INSERT INTO "plan_features" ("id", "plan_version_id", "feature", "enabled", "limit_value")
SELECT gen_random_uuid(), "latest"."id", "grant"."feature", "grant"."enabled", "grant"."limit_value"
FROM (VALUES
    ('starter', 'active_listings', true, 1000),
    ('starter', 'channel_connections', true, 3),
    ('starter', 'workspaces', true, 1),
    ('starter', 'members', true, 2),
    ('starter', 'api_keys', true, 5),
    ('starter', 'ai_credits', true, 300),
    ('starter', 'autonomous_agents', true, NULL),
    ('starter', 'bring_your_own_key', false, NULL),
    ('pro', 'active_listings', true, 3000),
    ('pro', 'channel_connections', true, 5),
    ('pro', 'workspaces', true, 1),
    ('pro', 'members', true, 5),
    ('pro', 'api_keys', true, 10),
    ('pro', 'ai_credits', true, 1500),
    ('pro', 'autonomous_agents', true, NULL),
    ('pro', 'bring_your_own_key', false, NULL),
    ('growth', 'active_listings', true, 10000),
    ('growth', 'channel_connections', true, 10),
    ('growth', 'workspaces', true, 2),
    ('growth', 'members', true, 10),
    ('growth', 'api_keys', true, 25),
    ('growth', 'ai_credits', true, 5000),
    ('growth', 'autonomous_agents', true, NULL),
    ('growth', 'bring_your_own_key', false, NULL),
    ('scale', 'active_listings', true, 50000),
    ('scale', 'channel_connections', true, NULL),
    ('scale', 'workspaces', true, 5),
    ('scale', 'members', true, 25),
    ('scale', 'api_keys', true, 100),
    ('scale', 'ai_credits', true, 20000),
    ('scale', 'autonomous_agents', true, NULL),
    ('scale', 'bring_your_own_key', true, NULL),
    ('enterprise', 'active_listings', true, 100000),
    ('enterprise', 'channel_connections', true, NULL),
    ('enterprise', 'workspaces', true, NULL),
    ('enterprise', 'members', true, NULL),
    ('enterprise', 'api_keys', true, NULL),
    ('enterprise', 'ai_credits', true, 20000),
    ('enterprise', 'autonomous_agents', true, NULL),
    ('enterprise', 'bring_your_own_key', true, NULL)
) AS "grant" ("plan_code", "feature", "enabled", "limit_value")
JOIN "plans" ON "plans"."code" = "grant"."plan_code"
JOIN LATERAL (
    SELECT "plan_versions"."id"
    FROM "plan_versions"
    WHERE "plan_versions"."plan_id" = "plans"."id"
    ORDER BY "plan_versions"."version" DESC
    LIMIT 1
) AS "latest" ON true;
