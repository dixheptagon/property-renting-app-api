/*
  Warnings:

  - You are about to drop the column `otp_code` on the `EmailVerification` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `EmailVerification` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `EmailVerification` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `EmailVerification` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[verification_token]` on the table `EmailVerification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `EmailVerification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verification_token` to the `EmailVerification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."EmailVerification" DROP CONSTRAINT "EmailVerification_user_id_fkey";

-- DropIndex
DROP INDEX "public"."EmailVerification_token_key";

-- AlterTable
ALTER TABLE "public"."EmailVerification" DROP COLUMN "otp_code",
DROP COLUMN "token",
DROP COLUMN "user_id",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "verification_code" TEXT,
ADD COLUMN     "verification_token" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'guest';

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerification_email_key" ON "public"."EmailVerification"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerification_verification_token_key" ON "public"."EmailVerification"("verification_token");
