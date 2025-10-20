/*
  Warnings:

  - You are about to drop the column `identification` on the `CustomerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `identification` on the `SaleProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."CustomerProfile" DROP COLUMN "identification";

-- AlterTable
ALTER TABLE "public"."SaleProfile" DROP COLUMN "identification";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "identification" TEXT;
