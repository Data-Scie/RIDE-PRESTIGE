CREATE TABLE "RideFlowEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "bookingId" TEXT,
    "bookingRef" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "actorId" TEXT,
    "actorRole" TEXT,
    "actorName" TEXT,
    "affiliateId" TEXT,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RideFlowEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RideFlowEvent_jobId_createdAt_idx" ON "RideFlowEvent"("jobId", "createdAt");
CREATE INDEX "RideFlowEvent_bookingId_createdAt_idx" ON "RideFlowEvent"("bookingId", "createdAt");
CREATE INDEX "RideFlowEvent_bookingRef_createdAt_idx" ON "RideFlowEvent"("bookingRef", "createdAt");
CREATE INDEX "RideFlowEvent_eventType_idx" ON "RideFlowEvent"("eventType");
