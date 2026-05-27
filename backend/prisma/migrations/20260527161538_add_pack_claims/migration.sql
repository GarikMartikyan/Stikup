-- CreateTable
CREATE TABLE "pack_claims" (
    "pack_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "delivered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" "Channel" NOT NULL,

    CONSTRAINT "pack_claims_pkey" PRIMARY KEY ("pack_id","user_id")
);

-- CreateIndex
CREATE INDEX "pack_claims_user_id_idx" ON "pack_claims"("user_id");
