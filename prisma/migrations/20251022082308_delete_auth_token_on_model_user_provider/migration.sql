/*
  Warnings:

  - You are about to drop the column `access_token` on the `UserProvider` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token` on the `UserProvider` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."UserProvider" DROP COLUMN "access_token",
DROP COLUMN "refresh_token";
