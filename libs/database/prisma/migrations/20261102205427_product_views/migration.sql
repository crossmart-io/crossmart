-- CreateTable
CREATE TABLE "product_views" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "search" TEXT,
    "status" "product_status",
    "gap" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_views_workspace_id_name_key" ON "product_views"("workspace_id", "name");

-- AddForeignKey
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
