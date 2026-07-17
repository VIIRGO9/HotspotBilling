/*
  Warnings:

  - The values [DISCONNECTED] on the enum `SessionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [GENERATED] on the enum `VoucherStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `deletedAt` on the `subscriptions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `packages` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PackageType" ADD VALUE 'PROMOTIONAL';

-- AlterEnum
ALTER TYPE "RouterStatus" ADD VALUE 'ERROR';

-- AlterEnum
BEGIN;
CREATE TYPE "SessionStatus_new" AS ENUM ('ACTIVE', 'EXPIRED', 'TERMINATED');
ALTER TABLE "public"."sessions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "sessions" ALTER COLUMN "status" TYPE "SessionStatus_new" USING ("status"::text::"SessionStatus_new");
ALTER TYPE "SessionStatus" RENAME TO "SessionStatus_old";
ALTER TYPE "SessionStatus_new" RENAME TO "SessionStatus";
DROP TYPE "public"."SessionStatus_old";
ALTER TABLE "sessions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "VoucherStatus_new" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED');
ALTER TABLE "public"."vouchers" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "vouchers" ALTER COLUMN "status" TYPE "VoucherStatus_new" USING ("status"::text::"VoucherStatus_new");
ALTER TYPE "VoucherStatus" RENAME TO "VoucherStatus_old";
ALTER TYPE "VoucherStatus_new" RENAME TO "VoucherStatus";
DROP TYPE "public"."VoucherStatus_old";
ALTER TABLE "vouchers" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_routerId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_customerId_fkey";

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "routerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "deletedAt",
ADD COLUMN     "voucherId" TEXT,
ALTER COLUMN "customerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "vouchers" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "packages_name_key" ON "packages"("name");

-- CreateIndex
CREATE INDEX "packages_type_idx" ON "packages"("type");

-- CreateIndex
CREATE INDEX "routers_ipAddress_idx" ON "routers"("ipAddress");

-- CreateIndex
CREATE INDEX "subscriptions_voucherId_idx" ON "subscriptions"("voucherId");

-- CreateIndex
CREATE INDEX "subscriptions_endDate_idx" ON "subscriptions"("endDate");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "vouchers_batchNumber_idx" ON "vouchers"("batchNumber");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "routers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
