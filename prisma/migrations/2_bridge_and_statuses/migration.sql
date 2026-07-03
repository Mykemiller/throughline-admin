-- New lifecycle statuses
ALTER TYPE "SubscriberStatus" ADD VALUE IF NOT EXISTS 'planned' BEFORE 'active';
ALTER TYPE "SubscriberStatus" ADD VALUE IF NOT EXISTS 'dead';

-- Link to the product's public.subscribers row (set by the bridge sync)
ALTER TABLE "Subscriber" ADD COLUMN "productId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_productId_key" ON "Subscriber"("productId");
