-- CreateTable
CREATE TABLE "SubCategory" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubCategory_isDeleted_idx" ON "SubCategory"("isDeleted");

-- CreateIndex
CREATE INDEX "SubCategory_categoryId_idx" ON "SubCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "SubCategory_title_categoryId_isDeleted_key" ON "SubCategory"("title", "categoryId", "isDeleted");

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
