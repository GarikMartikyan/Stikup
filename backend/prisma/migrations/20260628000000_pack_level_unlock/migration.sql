-- AlterTable
ALTER TABLE "packs" ADD COLUMN "unlocked_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "users" DROP COLUMN "full_pack_unlocked_at";
