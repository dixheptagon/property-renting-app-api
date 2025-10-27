/*
  Warnings:

  - Added the required column `status` to the `PropertyImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `RoomImage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ImageStatus" AS ENUM ('temp', 'draft', 'active', 'deleted');

-- AlterTable
ALTER TABLE "public"."PropertyImage" ADD COLUMN     "status" "public"."ImageStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."RoomImage" ADD COLUMN     "status" "public"."ImageStatus" NOT NULL;
