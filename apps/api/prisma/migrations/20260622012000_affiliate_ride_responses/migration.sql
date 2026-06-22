CREATE TABLE "AffiliateRideResponse" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'declined',
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateRideResponse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AffiliateRideResponse_jobId_affiliateId_key" ON "AffiliateRideResponse"("jobId", "affiliateId");
CREATE INDEX "AffiliateRideResponse_affiliateId_status_idx" ON "AffiliateRideResponse"("affiliateId", "status");
CREATE INDEX "AffiliateRideResponse_jobId_status_idx" ON "AffiliateRideResponse"("jobId", "status");

ALTER TABLE "AffiliateRideResponse"
  ADD CONSTRAINT "AffiliateRideResponse_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AffiliateRideResponse"
  ADD CONSTRAINT "AffiliateRideResponse_affiliateId_fkey"
  FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
