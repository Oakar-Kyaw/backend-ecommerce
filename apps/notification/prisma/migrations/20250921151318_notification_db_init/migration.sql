-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('CUSTOMER', 'ADMIN', 'SALE');

-- CreateTable
CREATE TABLE "public"."NotificationToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'CUSTOMER',
    "userId" INTEGER NOT NULL,
    "brandId" INTEGER,
    "branchId" INTEGER,

    CONSTRAINT "NotificationToken_pkey" PRIMARY KEY ("id")
);
