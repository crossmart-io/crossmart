-- An item condition per product (ADR 0029). Additive: a new enum and a nullable column, so
-- existing products keep using each store's default condition.
-- CreateEnum
CREATE TYPE "product_condition" AS ENUM ('NEW', 'NEW_OTHER', 'NEW_WITH_DEFECTS', 'LIKE_NEW', 'REFURBISHED', 'USED_EXCELLENT', 'USED_VERY_GOOD', 'USED_GOOD', 'USED_FAIR', 'FOR_PARTS');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "condition" "product_condition";
