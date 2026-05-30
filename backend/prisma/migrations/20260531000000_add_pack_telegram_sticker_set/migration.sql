ALTER TABLE "packs" ADD COLUMN "telegram_sticker_set_name" TEXT;
ALTER TABLE "packs" ADD COLUMN "telegram_sticker_count" INTEGER NOT NULL DEFAULT 0;
