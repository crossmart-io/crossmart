-- Sandbox accounts that AI agents open for people without an account yet (ADR 0019). Additive.
-- CreateTable
CREATE TABLE "sandbox_accounts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "claim_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "claim_email_sent_at" TIMESTAMP(3) NOT NULL,
    "claim_email_resent_at" TIMESTAMP(3),
    "claimed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sandbox_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sandbox_accounts_organization_id_key" ON "sandbox_accounts"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "sandbox_accounts_workspace_id_key" ON "sandbox_accounts"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "sandbox_accounts_user_id_key" ON "sandbox_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sandbox_accounts_claim_token_hash_key" ON "sandbox_accounts"("claim_token_hash");

-- CreateIndex
CREATE INDEX "sandbox_accounts_claimed_at_expires_at_idx" ON "sandbox_accounts"("claimed_at", "expires_at");

-- AddForeignKey
ALTER TABLE "sandbox_accounts" ADD CONSTRAINT "sandbox_accounts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sandbox_accounts" ADD CONSTRAINT "sandbox_accounts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sandbox_accounts" ADD CONSTRAINT "sandbox_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

