-- Performance indexes for dashboard counts, application queues, documents,
-- fleet filters, jobs, bookings, payments, notifications, and public CMS reads.

CREATE INDEX IF NOT EXISTS "Affiliate_isApproved_idx" ON "Affiliate" ("isApproved");
CREATE INDEX IF NOT EXISTS "Affiliate_createdAt_idx" ON "Affiliate" ("createdAt");

CREATE INDEX IF NOT EXISTS "Driver_affiliateId_idx" ON "Driver" ("affiliateId");
CREATE INDEX IF NOT EXISTS "Driver_driverType_idx" ON "Driver" ("driverType");
CREATE INDEX IF NOT EXISTS "Driver_status_isApproved_idx" ON "Driver" ("status", "isApproved");
CREATE INDEX IF NOT EXISTS "Driver_applicationStatus_idx" ON "Driver" ("applicationStatus");
CREATE INDEX IF NOT EXISTS "Driver_joinedDate_idx" ON "Driver" ("joinedDate");

CREATE INDEX IF NOT EXISTS "DriverDocument_driverId_status_idx" ON "DriverDocument" ("driverId", "status");
CREATE INDEX IF NOT EXISTS "DriverDocument_status_idx" ON "DriverDocument" ("status");

CREATE INDEX IF NOT EXISTS "AffiliateDocument_affiliateId_status_idx" ON "AffiliateDocument" ("affiliateId", "status");

CREATE INDEX IF NOT EXISTS "FleetVehicle_affiliateId_idx" ON "FleetVehicle" ("affiliateId");
CREATE INDEX IF NOT EXISTS "FleetVehicle_ownerDriverId_idx" ON "FleetVehicle" ("ownerDriverId");
CREATE INDEX IF NOT EXISTS "FleetVehicle_vehicleCategory_isApproved_approvalStatus_status_idx" ON "FleetVehicle" ("vehicleCategory", "isApproved", "approvalStatus", "status");
CREATE INDEX IF NOT EXISTS "FleetVehicle_approvalStatus_idx" ON "FleetVehicle" ("approvalStatus");
CREATE INDEX IF NOT EXISTS "FleetVehicle_status_idx" ON "FleetVehicle" ("status");

CREATE INDEX IF NOT EXISTS "VehicleDocument_vehicleId_status_idx" ON "VehicleDocument" ("vehicleId", "status");
CREATE INDEX IF NOT EXISTS "VehicleDocument_status_idx" ON "VehicleDocument" ("status");

CREATE INDEX IF NOT EXISTS "WebsiteVehicle_categorySlug_available_idx" ON "WebsiteVehicle" ("categorySlug", "available");
CREATE INDEX IF NOT EXISTS "WebsiteVehicle_available_idx" ON "WebsiteVehicle" ("available");

CREATE INDEX IF NOT EXISTS "WebsiteFleetCategory_available_order_idx" ON "WebsiteFleetCategory" ("available", "order");

CREATE INDEX IF NOT EXISTS "Job_status_dateTime_idx" ON "Job" ("status", "dateTime");
CREATE INDEX IF NOT EXISTS "Job_status_completedAt_idx" ON "Job" ("status", "completedAt");
CREATE INDEX IF NOT EXISTS "Job_affiliateId_status_idx" ON "Job" ("affiliateId", "status");
CREATE INDEX IF NOT EXISTS "Job_assignedDriverId_status_idx" ON "Job" ("assignedDriverId", "status");
CREATE INDEX IF NOT EXISTS "Job_assignedVehicleId_idx" ON "Job" ("assignedVehicleId");
CREATE INDEX IF NOT EXISTS "Job_bookingId_idx" ON "Job" ("bookingId");
CREATE INDEX IF NOT EXISTS "Job_vehicleCategory_status_idx" ON "Job" ("vehicleCategory", "status");
CREATE INDEX IF NOT EXISTS "Job_createdAt_idx" ON "Job" ("createdAt");

CREATE INDEX IF NOT EXISTS "Booking_status_createdAt_idx" ON "Booking" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Booking_customerId_createdAt_idx" ON "Booking" ("customerId", "createdAt");
CREATE INDEX IF NOT EXISTS "Booking_jobId_idx" ON "Booking" ("jobId");
CREATE INDEX IF NOT EXISTS "Booking_vehicleCategory_idx" ON "Booking" ("vehicleCategory");

CREATE INDEX IF NOT EXISTS "EarningEntry_entityId_entityType_date_idx" ON "EarningEntry" ("entityId", "entityType", "date");
CREATE INDEX IF NOT EXISTS "EarningEntry_jobId_idx" ON "EarningEntry" ("jobId");
CREATE INDEX IF NOT EXISTS "EarningEntry_status_date_idx" ON "EarningEntry" ("status", "date");

CREATE INDEX IF NOT EXISTS "Payment_bookingId_idx" ON "Payment" ("bookingId");
CREATE INDEX IF NOT EXISTS "Payment_jobId_idx" ON "Payment" ("jobId");
CREATE INDEX IF NOT EXISTS "Payment_status_createdAt_idx" ON "Payment" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Payment_transactionRef_idx" ON "Payment" ("transactionRef");

CREATE INDEX IF NOT EXISTS "Notification_recipientId_recipientRole_isRead_createdAt_idx" ON "Notification" ("recipientId", "recipientRole", "isRead", "createdAt");

CREATE INDEX IF NOT EXISTS "SupportTicket_status_createdAt_idx" ON "SupportTicket" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "SupportTicket_bookingReference_idx" ON "SupportTicket" ("bookingReference");

CREATE INDEX IF NOT EXISTS "NavigationItem_visible_order_idx" ON "NavigationItem" ("visible", "order");

CREATE INDEX IF NOT EXISTS "Promotion_active_startDate_endDate_idx" ON "Promotion" ("active", "startDate", "endDate");

CREATE INDEX IF NOT EXISTS "FAQItem_active_category_order_idx" ON "FAQItem" ("active", "category", "order");

CREATE INDEX IF NOT EXISTS "Vacancy_active_createdAt_idx" ON "Vacancy" ("active", "createdAt");

CREATE INDEX IF NOT EXISTS "Course_active_createdAt_idx" ON "Course" ("active", "createdAt");

CREATE INDEX IF NOT EXISTS "Attribute_category_active_idx" ON "Attribute" ("category", "active");

CREATE INDEX IF NOT EXISTS "RideStatusHistory_jobId_createdAt_idx" ON "RideStatusHistory" ("jobId", "createdAt");

CREATE INDEX IF NOT EXISTS "DriverLocationHistory_driverId_recordedAt_idx" ON "DriverLocationHistory" ("driverId", "recordedAt");
CREATE INDEX IF NOT EXISTS "DriverLocationHistory_jobId_recordedAt_idx" ON "DriverLocationHistory" ("jobId", "recordedAt");
