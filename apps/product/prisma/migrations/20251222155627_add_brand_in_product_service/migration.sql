-- CreateTable
CREATE TABLE "Brand" (
    "id" SERIAL NOT NULL,
    "brandId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);
