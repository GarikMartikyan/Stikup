-- AlterTable
ALTER TABLE "login_tokens" ADD COLUMN     "telegram_chat_id" BIGINT,
ADD COLUMN     "telegram_message_id" INTEGER;
