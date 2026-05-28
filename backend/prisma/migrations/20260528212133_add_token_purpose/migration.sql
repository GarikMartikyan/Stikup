-- CreateEnum
CREATE TYPE "TokenPurpose" AS ENUM ('login', 'link');

-- AlterTable
ALTER TABLE "login_tokens" ADD COLUMN     "purpose" "TokenPurpose" NOT NULL DEFAULT 'login';
