-- DropForeignKey
ALTER TABLE "ad_rewards" DROP CONSTRAINT "ad_rewards_user_id_fkey";

-- DropIndex
DROP INDEX "ad_rewards_user_id_idx";

-- DropTable
DROP TABLE "ad_rewards";
