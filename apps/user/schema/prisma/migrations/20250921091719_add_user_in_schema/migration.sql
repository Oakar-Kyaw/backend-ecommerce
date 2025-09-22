/*
  Warnings:

  - You are about to drop the `CustomerProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SaleProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CustomerProfile" DROP CONSTRAINT "CustomerProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SaleProfile" DROP CONSTRAINT "SaleProfile_userId_fkey";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "interest" TEXT,
ADD COLUMN     "salary" INTEGER;

-- DropTable
DROP TABLE "public"."CustomerProfile";

-- DropTable
DROP TABLE "public"."SaleProfile";
