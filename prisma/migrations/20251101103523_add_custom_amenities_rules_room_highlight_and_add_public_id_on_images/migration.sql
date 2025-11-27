-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "custom_amenities" JSONB,
ADD COLUMN     "custom_rules" JSONB;

-- AlterTable
ALTER TABLE "PropertyImage" ADD COLUMN     "public_id" TEXT;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "custom_highlight" JSONB;

-- AlterTable
ALTER TABLE "RoomImage" ADD COLUMN     "public_id" TEXT;
