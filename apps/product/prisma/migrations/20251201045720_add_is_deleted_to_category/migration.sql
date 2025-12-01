/*
  Warnings:

  - A unique constraint covering the columns `[title,isDeleted]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Category_isDeleted_idx" ON "Category"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "Category_title_isDeleted_key" ON "Category"("title", "isDeleted");
