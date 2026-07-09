/*
  Warnings:

  - You are about to drop the `_GroupMembers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_GroupMembers" DROP CONSTRAINT "_GroupMembers_A_fkey";

-- DropForeignKey
ALTER TABLE "_GroupMembers" DROP CONSTRAINT "_GroupMembers_B_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "groupSmallId" INTEGER;

-- DropTable
DROP TABLE "_GroupMembers";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_groupSmallId_fkey" FOREIGN KEY ("groupSmallId") REFERENCES "GroupSmall"("id") ON DELETE SET NULL ON UPDATE CASCADE;
