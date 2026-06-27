-- CreateTable
CREATE TABLE "pending_referrals" (
    "channel" "Channel" NOT NULL,
    "channel_user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "pack_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pending_referrals_pkey" PRIMARY KEY ("channel","channel_user_id")
);

-- CreateIndex
CREATE INDEX "pending_referrals_expires_at_idx" ON "pending_referrals"("expires_at");
