-- AlterEnum
ALTER TYPE "workspace_role" ADD VALUE 'CUSTOM';

-- AlterTable
ALTER TABLE "workspace_members" ADD COLUMN     "custom_role_id" UUID;

-- AlterTable
ALTER TABLE "workspace_invitations" ADD COLUMN     "custom_role_id" UUID;

-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "custom_role_id" UUID;

-- CreateTable
CREATE TABLE "custom_roles" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_roles_workspace_id_name_key" ON "custom_roles"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "workspace_members_custom_role_id_idx" ON "workspace_members"("custom_role_id");

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_custom_role_id_fkey" FOREIGN KEY ("custom_role_id") REFERENCES "custom_roles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_roles" ADD CONSTRAINT "custom_roles_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_custom_role_id_fkey" FOREIGN KEY ("custom_role_id") REFERENCES "custom_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_custom_role_id_fkey" FOREIGN KEY ("custom_role_id") REFERENCES "custom_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- A member has a custom role exactly when their role is CUSTOM. Compared as text: a value added to
-- an enum cannot be used as an enum in the transaction that adds it.
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_custom_role_check"
  CHECK (("role"::text = 'CUSTOM') = ("custom_role_id" IS NOT NULL));

-- Invitations and keys keep their row when their custom role is deleted (the id becomes null and
-- they grant nothing), so only a custom role without CUSTOM is refused.
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_custom_role_check"
  CHECK ("custom_role_id" IS NULL OR "role"::text = 'CUSTOM');
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_custom_role_check"
  CHECK ("custom_role_id" IS NULL OR "role"::text = 'CUSTOM');
