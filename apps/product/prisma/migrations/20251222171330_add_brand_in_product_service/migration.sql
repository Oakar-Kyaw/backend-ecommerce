/*
  Warnings:

  - Added the required column `email` to the `Brand` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "email" TEXT NOT NULL;
