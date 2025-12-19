/*
  Warnings:

  - A unique constraint covering the columns `[userId,productId]` on the table `AddToCart` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,productId]` on the table `UserFavorite` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AddToCart_userId_productId_key" ON "AddToCart"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavorite_userId_productId_key" ON "UserFavorite"("userId", "productId");
