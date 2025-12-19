/*
  Warnings:

  - A unique constraint covering the columns `[providerUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('PASSWORD', 'GOOGLE', 'FACEBOOK', 'APPLE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "provider" "Provider" NOT NULL DEFAULT 'PASSWORD',
ADD COLUMN     "providerUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_providerUserId_key" ON "User"("providerUserId");
