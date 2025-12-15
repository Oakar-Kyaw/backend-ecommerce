/*
  Warnings:

  - You are about to drop the column `device_tokens` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "device_tokens";
