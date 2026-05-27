-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT,
    "paymentId" TEXT,
    "subscriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'received',
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB,
    "error" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebhookEvent_provider_status_createdAt_idx" ON "public"."WebhookEvent"("provider", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WebhookEvent_paymentId_idx" ON "public"."WebhookEvent"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key" ON "public"."WebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_createdAt_idx" ON "public"."AuditLog"("resourceType", "resourceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_actor_createdAt_idx" ON "public"."AuditLog"("actor", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_status_fulfillmentStatus_idx" ON "public"."Order"("status", "fulfillmentStatus");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "public"."Order"("status", "createdAt" DESC);
