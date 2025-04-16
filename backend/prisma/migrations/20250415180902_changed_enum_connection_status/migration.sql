/*
  Warnings:

  - The values [REJECTED] on the enum `ConnectionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ConnectionStatus_new" AS ENUM ('PENDING', 'ACCEPTED');
ALTER TABLE "Connection" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Connection" ALTER COLUMN "status" TYPE "ConnectionStatus_new" USING ("status"::text::"ConnectionStatus_new");
ALTER TYPE "ConnectionStatus" RENAME TO "ConnectionStatus_old";
ALTER TYPE "ConnectionStatus_new" RENAME TO "ConnectionStatus";
DROP TYPE "ConnectionStatus_old";
ALTER TABLE "Connection" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
