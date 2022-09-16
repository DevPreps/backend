/*
  Warnings:

  - You are about to drop the column `likedPostId` on the `Likes` table. All the data in the column will be lost.
  - You are about to drop the column `likedUserId` on the `Likes` table. All the data in the column will be lost.
  - Added the required column `postId` to the `Likes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Likes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Likes" DROP CONSTRAINT "Likes_likedPostId_fkey";

-- DropForeignKey
ALTER TABLE "Likes" DROP CONSTRAINT "Likes_likedUserId_fkey";

-- AlterTable
ALTER TABLE "Likes" DROP COLUMN "likedPostId",
DROP COLUMN "likedUserId",
ADD COLUMN     "postId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Likes" ADD CONSTRAINT "Likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Likes" ADD CONSTRAINT "Likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
