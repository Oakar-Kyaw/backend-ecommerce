/*
  Warnings:

  - You are about to drop the column `bio` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `interest` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `middleName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `salary` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "bio",
DROP COLUMN "interest",
DROP COLUMN "middleName",
DROP COLUMN "salary",
ALTER COLUMN "firstName" DROP NOT NULL;
