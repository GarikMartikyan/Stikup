-- Drop dead quota columns: the quota system was removed (generations are
-- unlimited, gated by a rewarded ad). These columns are read nowhere.
ALTER TABLE "users" DROP COLUMN IF EXISTS "generations_used";
ALTER TABLE "users" DROP COLUMN IF EXISTS "generation_locked_at";

-- pack_claims previously had NO foreign keys, so rows were orphaned on pack/user
-- delete. Add them with ON DELETE CASCADE. pack_id was TEXT; retype to uuid to
-- match packs.id (the cast is safe — values are already uuids, and a fresh DB is
-- empty anyway).
ALTER TABLE "pack_claims" ALTER COLUMN "pack_id" TYPE UUID USING "pack_id"::uuid;

ALTER TABLE "pack_claims"
  ADD CONSTRAINT "pack_claims_pack_id_fkey"
  FOREIGN KEY ("pack_id") REFERENCES "packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pack_claims"
  ADD CONSTRAINT "pack_claims_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
