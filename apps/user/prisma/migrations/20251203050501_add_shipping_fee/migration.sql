-- CreateTable
CREATE TABLE "ShippingFee" (
    "id" SERIAL NOT NULL,
    "country" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MMK',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShippingFee_country_isDeleted_idx" ON "ShippingFee"("country", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingFee_country_weightKg_isDeleted_key" ON "ShippingFee"("country", "weightKg", "isDeleted");
