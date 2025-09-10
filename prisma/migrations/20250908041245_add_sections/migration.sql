/*
  Warnings:

  - You are about to drop the column `content` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Post" DROP COLUMN "content";

-- CreateTable
CREATE TABLE "public"."PostSection" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "heading" TEXT,
    "subheading" TEXT,
    "content" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostSection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."PostSection" ADD CONSTRAINT "PostSection_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
