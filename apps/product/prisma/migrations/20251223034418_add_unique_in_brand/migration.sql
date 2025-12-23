/*
  Warnings:

  - A unique constraint covering the columns `[brandId]` on the table `Brand` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Brand_brandId_key" ON "Brand"("brandId");
