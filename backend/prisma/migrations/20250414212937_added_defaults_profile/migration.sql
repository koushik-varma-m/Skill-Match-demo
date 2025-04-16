/*
  Warnings:

  - The `skills` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `experience` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "about" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "education" TEXT[] DEFAULT ARRAY['']::TEXT[],
ADD COLUMN     "profilePicture" TEXT NOT NULL DEFAULT '',
DROP COLUMN "skills",
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY['']::TEXT[],
DROP COLUMN "experience",
ADD COLUMN     "experience" TEXT[] DEFAULT ARRAY['']::TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
