-- AlterEnum
ALTER TYPE "Channel" ADD VALUE 'email';
ALTER TYPE "Channel" ADD VALUE 'google';

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "password_hash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
