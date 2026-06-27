-- CreateTable
CREATE TABLE "ad_rewards" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ad_rewards_user_id_idx" ON "ad_rewards"("user_id");

-- AddForeignKey
ALTER TABLE "ad_rewards" ADD CONSTRAINT "ad_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
