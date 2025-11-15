-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'MALE',
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Brand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "description" TEXT,
    "feedback" TEXT,
    "info" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandUserRelationship" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "brandId" INTEGER NOT NULL,

    CONSTRAINT "BrandUserRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_code_key" ON "Brand"("code");

-- CreateIndex
CREATE INDEX "Brand_isDeleted_idx" ON "Brand"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_isDeleted_key" ON "Brand"("name", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "BrandUserRelationship_userId_brandId_key" ON "BrandUserRelationship"("userId", "brandId");

-- AddForeignKey
ALTER TABLE "BrandUserRelationship" ADD CONSTRAINT "BrandUserRelationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandUserRelationship" ADD CONSTRAINT "BrandUserRelationship_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
