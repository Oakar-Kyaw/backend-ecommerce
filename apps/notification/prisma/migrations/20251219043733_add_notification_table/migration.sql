-- AlterTable
ALTER TABLE "NotificationToken" ADD COLUMN     "branchId" INTEGER;

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "brandId" INTEGER,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
