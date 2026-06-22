CREATE TABLE IF NOT EXISTS "AffiliateRideResponse" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "jobId" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'declined',
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateRideResponse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateRideResponse_jobId_affiliateId_key" ON "AffiliateRideResponse"("jobId", "affiliateId");
CREATE INDEX IF NOT EXISTS "AffiliateRideResponse_affiliateId_status_idx" ON "AffiliateRideResponse"("affiliateId", "status");
CREATE INDEX IF NOT EXISTS "AffiliateRideResponse_jobId_status_idx" ON "AffiliateRideResponse"("jobId", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AffiliateRideResponse_jobId_fkey'
  ) THEN
    ALTER TABLE "AffiliateRideResponse"
      ADD CONSTRAINT "AffiliateRideResponse_jobId_fkey"
      FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AffiliateRideResponse_affiliateId_fkey'
  ) THEN
    ALTER TABLE "AffiliateRideResponse"
      ADD CONSTRAINT "AffiliateRideResponse_affiliateId_fkey"
      FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
