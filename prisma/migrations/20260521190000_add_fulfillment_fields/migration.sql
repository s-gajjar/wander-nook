-- AlterTable
ALTER TABLE "Order" ADD COLUMN "fulfillmentStatus" TEXT NOT NULL DEFAULT 'unfulfilled';
ALTER TABLE "Order" ADD COLUMN "fulfilledAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "shippedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "trackingUrl" TEXT;

-- CreateIndex
CREATE INDEX "Order_fulfillmentStatus_idx" ON "Order"("fulfillmentStatus");
