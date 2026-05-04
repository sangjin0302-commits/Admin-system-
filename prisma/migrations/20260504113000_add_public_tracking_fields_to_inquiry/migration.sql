ALTER TABLE "Inquiry" ADD COLUMN "publicTrackingCode" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "publicTrackingPhoneLast4" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "publicTrackingIssuedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Inquiry_publicTrackingCode_key" ON "Inquiry"("publicTrackingCode");
CREATE INDEX "Inquiry_publicTrackingPhoneLast4_idx" ON "Inquiry"("publicTrackingPhoneLast4");
CREATE INDEX "Inquiry_publicTrackingIssuedAt_idx" ON "Inquiry"("publicTrackingIssuedAt");
