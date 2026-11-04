-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "time_zone" TEXT;

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" UUID NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "rate_per_euro" DECIMAL(18,6) NOT NULL,
    "published_on" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exchange_rates_published_on_idx" ON "exchange_rates"("published_on");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_currency_published_on_key" ON "exchange_rates"("currency", "published_on");

