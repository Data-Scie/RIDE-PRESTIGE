ALTER TABLE "Driver"
ADD COLUMN "serviceAreas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "DriverDocument"
ADD COLUMN "fileUrl" TEXT;

ALTER TABLE "FleetVehicle"
ADD COLUMN "ownerDriverId" TEXT,
ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "FleetVehicle"
SET "approvalStatus" = 'approved', "isApproved" = true
WHERE "affiliateId" IS NOT NULL;

ALTER TABLE "FleetVehicle"
ADD CONSTRAINT "FleetVehicle_ownerDriverId_fkey"
FOREIGN KEY ("ownerDriverId") REFERENCES "Driver"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Job"
ADD COLUMN "pickupLatitude" DOUBLE PRECISION,
ADD COLUMN "pickupLongitude" DOUBLE PRECISION;

CREATE TABLE "RideOffer" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RideOffer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RideOffer_jobId_driverId_key" ON "RideOffer"("jobId", "driverId");
CREATE INDEX "RideOffer_driverId_status_expiresAt_idx" ON "RideOffer"("driverId", "status", "expiresAt");
CREATE INDEX "RideOffer_jobId_status_idx" ON "RideOffer"("jobId", "status");

ALTER TABLE "RideOffer"
ADD CONSTRAINT "RideOffer_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "Job"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RideOffer"
ADD CONSTRAINT "RideOffer_driverId_fkey"
FOREIGN KEY ("driverId") REFERENCES "Driver"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
